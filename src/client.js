import crud from '@cocreate/crud-client';
import indexeddb from '@cocreate/indexeddb';
import action from '@cocreate/actions';
import form from '@cocreate/form';

const CoCreateOrganization = {

    createOrganization: async function (btn) {
        let formEl = btn.closest("form");
        if (!formEl) return;

        let organization = form.getData(formEl, 'organizations')
        let user = form.getData(formEl, 'users')

        if (!organization || !organization.object)
            return
        if (!user || !user.object)
            return

        if (!organization.object._id && !user.object._id) {
            let objects = await indexeddb.generateDB(organization, user)
            if (!objects)
                return
        }

        form.setObjectId(formEl, organization)
        form.setObjectId(formEl, user)

        organization = organization.object[0]
        user = user.object[0]

        let organization_id = organization._id

        if (crud.socket.organization !== true) {
            crud.socket.organization = true
            crud.socket.create({ organization_id })
        }

        let response = await crud.socket.send({
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
};

action.init({
    name: "createOrganization",
    endEvent: "createdOrganization",
    callback: (data) => {
        CoCreateOrganization.createOrganization(data.element);
    }
});

export default CoCreateOrganization;