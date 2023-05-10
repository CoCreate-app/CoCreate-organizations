import crud from '@cocreate/crud-client';
import indexeddb from '@cocreate/indexeddb';
import action from '@cocreate/actions';
import form from '@cocreate/form';

const CoCreateOrganization = {
		
	createOrg: async function(btn) {
		let formEl = btn.closest("form");
		if (!formEl) return;

		let organization = {
			collection: 'organizations',
			document: [{
				_id: crud.socket.config.organization_id,
				key: crud.socket.config.key
			}]
		}
		
		let user = {
			collection: 'users',
			document: [{
				_id: crud.socket.config.user_id
			}]
		}

		form.setDocumentId(formEl, organization)
		form.setDocumentId(formEl, user)

		organization = form.getData(formEl, 'organizations')
		user = form.getData(formEl, 'users')

		let documents = await indexeddb.generateDB(organization, user)
		
		let response = await crud.socket.send('createOrg', {
			documents,
			broadcastBrowser: false
		});

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