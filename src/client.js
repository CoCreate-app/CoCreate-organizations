import Crud from '@cocreate/crud-client';
import Action from '@cocreate/actions';
import Form from '@cocreate/form';


async function generateDB(organization = { object: {} }, user = { object: {} }) {
    const organization_id = organization.object._id || Crud.ObjectId();
    const defaultKey = organization.object.key || uuid.generate();
    const user_id = user.object._id || Crud.ObjectId();

    let apiKey = await Crud.send({ method: 'create.object', database: organization_id, array: 'keys', organization_id })
    if (apiKey && apiKey.object && apiKey.object[0])
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
                key: defaultKey,
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

        return { organization: organization.object, key: key.object, user: user.object, role: role.object, userKey: userKey.object }

    } catch (error) {
        return false
    }
}

async function create(btn) {
    let formEl = btn.closest("form");
    if (!formEl) return;

    let organization = Form.getData(formEl, 'organizations')
    let user = Form.getData(formEl, 'users')

    if (!organization || !organization.object)
        return
    if (!user || !user.object)
        return

    if (!organization.object._id && !user.object._id) {
        let objects = await generateDB(organization, user)
        if (!objects)
            return
    }

    Form.setObjectId(formEl, organization)
    Form.setObjectId(formEl, user)

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

export default { generateDB, create };