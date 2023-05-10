import crud from '@cocreate/crud-client';
import indexeddb from '@cocreate/indexeddb';
import action from '@cocreate/actions';
import { getData, setDocumentId } from '@cocreate/form';

const CoCreateOrganization = {
		
	createOrg: async function(btn) {
		let form = btn.closest("form");
		if (!form) return;

		let organization = getData(form, 'organizations')
		let user = getData(form, 'users')
		
		let documents = indexeddb.generateDB(organization, user)
		
		let response = await crud.socket.send('createOrg', {
			documents,
			broadcastBrowser: false
		});

		setDocumentId(form, organization)
		setDocumentId(form, user)

		document.dispatchEvent(new CustomEvent('createdOrg', {
			detail: response
		}));

	},	
	
	deleteOrg: async function(btn) {
		const { collection, document_id } = crud.getAttributes(btn);
		const organization_id = document_id;

		if (crud.checkValue(collection) && crud.checkValue(document_id)) {

			crud.socket.send('deleteOrg', {
				collection,
				document_id,
				data: {
					organization_id,
				},
				'metadata': 'deleteOrg-action'
			}).then(response => {

				// ToDo: replace with custom event
				document.dispatchEvent(new CustomEvent('deletedOrg', {
					detail: {}
				}));
			})
		}
	},

	deleteOrgs: async function(btn) {
		const collection = btn.getAttribute('collection');
		if (crud.checkValue(collection)) {
			const dataTemplateid = btn.getAttribute('template_id');
			if (!dataTemplateid) return;

			const selectedEls = document.querySelectorAll(`.selected[templateid="${dataTemplateid}"]`);

			selectedEls.forEach((el) => {
				const document_id = el.getAttribute('document_id');
				const organization_id = document_id;

				if (crud.checkValue(document_id)) {
					crud.socket.send('deleteOrg', {
						collection,
						document_id,
						data: {
							organization_id,
						},
						'metadata': 'deleteOrgs-action'
					})
				}
			});

			document.dispatchEvent(new CustomEvent('deletedOrgs', {
				detail: {}
			}));
		}
	}

};

action.init({
	name: "createOrg",
	endEvent: "createdOrg",
	callback: (btn, data) => {
		CoCreateOrganization.createOrg(btn);
	},
});

action.init({
	name: "deleteOrg",
	endEvent: "deletedOrg",
	callback: (btn, data) => {
		CoCreateOrganization.deleteOrg(btn);
	},
});

action.init({
	name: "deleteOrgs",
	endEvent: "deletedOrgs",
	callback: (btn, data) => {
		CoCreateOrganization.deleteOrgs(btn);
	},
});

CoCreateOrganization.init();

export default CoCreateOrganization;