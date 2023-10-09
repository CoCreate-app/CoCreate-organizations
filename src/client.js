import Crud from '@cocreate/crud-client';
import Action from '@cocreate/actions';
import Elements from '@cocreate/elements';
import Config from '@cocreate/config';

async function generateDB(organization = { object: {} }, user = { object: {} }) {
    const organization_id = organization.object._id || Crud.ObjectId();
    const apikey = organization.object.key || uuid.generate();
    const user_id = user.object._id || Crud.ObjectId();

    let hasApiKey = await Crud.send({ method: 'read.object', database: organization_id, array: 'keys', organization_id })
    if (hasApiKey && hasApiKey.object && hasApiKey.object[0])
        return

    try {
        // Create organization 
        organization.method = 'create.object'
        organization.storage = 'indexeddb'
        organization.database = organization_id
        organization.array = 'organizations'
        organization.object._id = organization_id
        organization.object.name = organization.object.name || 'untitiled'
        organization.organization_id = organization_id
        Crud.send(organization);

        // Create user
        user.method = 'create.object'
        user.storage = 'indexeddb'
        user.database = organization_id
        user.array = 'users'
        user.object._id = user_id
        user.object.firstname = user.object.firstname || 'untitiled'
        user.object.lastname = user.object.lastname || 'untitiled'
        user.organization_id = organization_id
        Crud.send(user);

        // Create default key
        let key = {
            method: 'create.object',
            storage: 'indexeddb',
            database: organization_id,
            array: 'keys',
            object: {
                _id: Crud.ObjectId(),
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
        Crud.send(key);

        // Create role
        let role_id = Crud.ObjectId();
        let role = {
            method: 'create.object',
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
        Crud.send(role);

        // Create user key
        let userKey = {
            method: 'create.object',
            storage: 'indexeddb',
            database: organization_id,
            array: 'keys',
            object: {
                _id: Crud.ObjectId(),
                type: "user",
                key: user_id,
                array: 'users', // could be any array
                roles: [role_id],
                email: user.object.email,
                password: user.object.password || btoa('0000')
            },
            organization_id
        };
        Crud.send(userKey);

        return { organization: organization.object, apikey, user: user.object, role: role.object, userKey: userKey.object }

    } catch (error) {
        return false
    }
}

async function get() {
    let organization_id = await getOrganizationFromServiceWorker()
    if (!organization_id) {
        let data = await indexeddb.send({ method: 'read.database' })
        for (let database of data.database) {
            let name = database.database.name
            if (name.match(/^[0-9a-fA-F]{24}$/)) {
                organization_id = name
            }
        }
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
        navigator.serviceWorker.ready
            .then(() => {
                navigator.serviceWorker.controller.postMessage({ action: 'getOrganization' }, [msg.port1]);
            })
            .catch(reject);
    });
}

async function createOrganization() {
    let createOrganization = document.querySelector('[actions*="createOrganization"]')

    if (Crud.socket.organization == 'canceled' || Crud.socket.organization == 'pending') return

    if (!createOrganization && confirm("An organization_id could not be found, if you already have an organization_id add it to this html and refresh the page.\n\nOr click 'OK' create a new organization") == true) {
        Crud.socket.organization = 'pending'
        if (indexeddb) {
            try {
                // const Organization = await import('@cocreate/organizations')

                let org = { object: {} }
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
    } else {
        Crud.socket.organization = 'canceled'
    }
}


async function create(btn) {
    let formEl = btn.closest("form");
    if (!formEl) return;

    let organization = Elements.getFormData(formEl, 'organizations')
    let user = Elements.getFormData(formEl, 'users')

    if (!organization || !organization.object)
        return
    if (!user || !user.object)
        return

    if (!organization.object._id && !user.object._id) {
        let objects = await generateDB(organization, user)
        if (!objects)
            return
    }

    Elements.setTypeValue(formEl, organization)
    Elements.setTypeValue(formEl, user)

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
        CoCreateOrganization.create(action.element);
    }
});

export default { generateDB, create, get };