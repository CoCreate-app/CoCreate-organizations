import crud from '@cocreate/crud-client';
import indexeddb from '@cocreate/indexeddb';
import action from '@cocreate/actions';
import form from '@cocreate/form';

const CoCreateOrganization = {
		
	createOrg: async function(btn) {
		let formEl = btn.closest("form");
		if (!formEl) return;

		let organization = form.getData(formEl, 'organizations')
		let user = form.getData(formEl, 'users')

		let response
		let documents = await indexeddb.generateDB(organization, user)
		
		if (documents) {
			if(!organization || !organization.document || !organization.document[0]) return
			let org = organization.document[0]
			let organization_id = org._id	
			let key = org.key

			if (crud.socket.organization !== true) {
				crud.socket.organization = true
				crud.socket.create({organization_id, key})
			}

			form.setDocumentId(formEl, organization)
			form.setDocumentId(formEl, user)

			response = await crud.socket.send('createOrg', {
				documents,
				broadcastBrowser: false,
				organization_id,
				key
			});
		}

		document.dispatchEvent(new CustomEvent('createdOrg', {
			detail: response
		}));
	}
};

action.init({
	name: "createOrg",
	endEvent: "createdOrg",
	callback: (btn, data) => {
		CoCreateOrganization.createOrg(btn);
	},
});

export default CoCreateOrganization;