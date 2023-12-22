import Crud from '@cocreate/crud-client';
import Action from '@cocreate/actions';
import Elements from '@cocreate/elements';
import Config from '@cocreate/config';
import Indexeddb from '@cocreate/indexeddb';
import uuid from '@cocreate/uuid';

async function generateDB(organization = { object: {} }, user = { object: {} }) {
    const organization_id = organization.object._id || Crud.ObjectId().toString();
    const apikey = organization.object.key || uuid.generate();
    const user_id = user.object._id || Crud.ObjectId().toString();

    try {
        // Create organization 
        organization.method = 'object.create'
        organization.storage = 'indexeddb'
        organization.database = organization_id
        organization.array = 'organizations'
        organization.object._id = organization_id
        organization.object.name = organization.object.name || 'untitiled'
        organization.organization_id = organization_id
        Indexeddb.send(organization);

        // Create user
        user.method = 'object.create'
        user.storage = 'indexeddb'
        user.database = organization_id
        user.array = 'users'
        user.object._id = user_id
        user.object.firstname = user.object.firstname || 'untitiled'
        user.object.lastname = user.object.lastname || 'untitiled'
        user.organization_id = organization_id
        Indexeddb.send(user);

        // Create default key
        let key = {
            method: 'object.create',
            storage: 'indexeddb',
            database: organization_id,
            array: 'keys',
            object: {
                _id: Crud.ObjectId().toString(),
                type: "key",
                key: apikey,
                actions: {
                    signIn: true,
                    signUp: true
                },
                default: true
            },
            organization_id
        }
        Indexeddb.send(key);

        // Create role
        let role_id = Crud.ObjectId().toString();
        let role = {
            method: 'object.create',
            storage: 'indexeddb',
            database: organization_id,
            array: 'keys',
            object: {
                _id: role_id,
                type: "role",
                name: "admin",
                admin: "true"
            },
            organization_id
        };
        Indexeddb.send(role);

        // Create user key
        let userKey = {
            method: 'object.create',
            storage: 'indexeddb',
            database: organization_id,
            array: 'keys',
            object: {
                _id: Crud.ObjectId().toString(),
                type: "user",
                key: user_id,
                array: 'users', // could be any array
                roles: [role_id],
                email: user.object.email,
                password: user.object.password || btoa('0000')
            },
            organization_id
        };
        Indexeddb.send(userKey);

        return { organization: organization.object, apikey, user: user.object, role: role.object, userKey: userKey.object }

    } catch (error) {
        return false
    }
}

async function get() {
    let organization_id = await getOrganizationFromServiceWorker()
    if (!organization_id) {
        let data = await Indexeddb.send({ method: 'database.read' })
        for (let database of data.database) {
            let name = database.name
            if (name.match(/^[0-9a-fA-F]{24}$/)) {
                organization_id = name
            }
        }
    }

    if (!organization_id) {
        let file = await fetch('/')
        organization_id = file.headers.get('organization');
    }

    if (!organization_id)
        organization_id = await createOrganization()

    if (organization_id)
        Config.set('organization_id', organization_id)

    return organization_id

}

async function getOrganizationFromServiceWorker() {
    return new Promise((resolve, reject) => {
        if (!navigator.serviceWorker)
            return resolve()

        const handleMessage = (event) => {
            if (event.data.action === 'getOrganization') {
                navigator.serviceWorker.removeEventListener('message', handleMessage); // Remove the event listener
                resolve(event.data.organization_id);
            }
        };

        navigator.serviceWorker.addEventListener('message', handleMessage);

        // Send message to Service Worker
        const msg = new MessageChannel();

        navigator.serviceWorker.ready.then(registration => {
            if (navigator.serviceWorker.controller) {
                // If there's an active controller, send the message
                navigator.serviceWorker.controller.postMessage({ action: 'getOrganization' }, [msg.port1]);
            } else {
                // Listen for a new service worker to start controlling the page
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    if (navigator.serviceWorker.controller) {
                        navigator.serviceWorker.controller.postMessage({ action: 'getOrganization' }, [msg.port1]);
                    }
                });
            }
        }).catch(error => {
            console.error(reject);
        });
    });
}

let organizationPromise = null;
async function createOrganizationPromise() {
    let createOrganization = document.querySelector('[actions*="createOrganization"]')
    if (createOrganization)
        return Crud.socket.organization = 'canceled'

    if (Crud.socket.organization == 'canceled' || Crud.socket.organization == 'pending') return

    const organization_id = prompt("An organization_id could not be found, if you already have an organization_id input it now.\n\nOr leave blank and click 'OK' to create a new organization");

    if (organization_id)
        return organization_id
    if (organization_id === null)
        return Crud.socket.organization = 'canceled'

    Crud.socket.organization = 'pending'
    if (Indexeddb) {
        try {
            let org = { object: {} }
            if (organization_id)
                org.object._id = organization_id
            let { organization, apikey, user } = await generateDB(org)
            if (organization && apikey && user) {
                Crud.socket.apikey = apikey
                Crud.socket.user_id = user._id
                Config.set('organization_id', organization._id)
                Config.set('apikey', apikey)
                Config.set('user_id', user._id)
                Crud.socket.organization = true
                return organization._id
            }
        } catch (error) {
            console.error('Failed to load the script:', error);
        }
    }
}


async function createOrganization() {
    return organizationPromise || (organizationPromise = createOrganizationPromise());
}

async function create(form) {
    if (!form) return;

    let organization = Elements.getData(form, 'organizations')
    let user = Elements.getData(form, 'users')

    if (!organization || !organization.object)
        return
    if (!user || !user.object)
        return

    if (!organization.object._id && !user.object._id) {
        let objects = await generateDB(organization, user)
        if (!objects)
            return
    }

    Elements.setTypeValue(form, organization)
    Elements.setTypeValue(form, user)

    organization = organization.object[0]
    user = user.object[0]

    let organization_id = organization._id

    if (Crud.socket.organization !== true) {
        Crud.socket.organization = true
        Crud.socket.create({ organization_id })
    }

    let response = await Crud.socket.send({
        method: 'createOrganization',
        organization,
        user,
        broadcastBrowser: false,
        organization_id
    });

    document.dispatchEvent(new CustomEvent('createdOrganization', {
        detail: response
    }));
}

Action.init({
    name: "createOrganization",
    endEvent: "createdOrganization",
    callback: (action) => {
        create(action.form);
    }
});

export default { generateDB, create, get };