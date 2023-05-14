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

        if (!organization || !organization.document)
            return
        if (!user || !user.document)
            return

        if (!organization.document._id && !user.document._id) {
            let documents = await indexeddb.generateDB(organization, user)
            if (!documents)
                return
        }

        form.setDocumentId(formEl, organization)
        form.setDocumentId(formEl, user)

        organization = organization.document[0]
        user = user.document[0]

        let organization_id = organization._id
        let key = organization.key

        if (crud.socket.organization !== true) {
            crud.socket.organization = true
            crud.socket.create({ organization_id, key })
        }

        let response = await crud.socket.send('createOrganization', {
            organization,
            user,
            broadcastBrowser: false,
            organization_id,
            key
        });

        document.dispatchEvent(new CustomEvent('createdOrganization', {
            detail: response
        }));
    }
};

action.init({
    name: "createOrganization",
    endEvent: "createdOrganization",
    callback: (btn) => {
        CoCreateOrganization.createOrganization(btn);
    }
});

export default CoCreateOrganization;