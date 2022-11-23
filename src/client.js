import CRUD from '@cocreate/crud-client';
import '@cocreate/element-prototype';
import action from '@cocreate/actions';
import uuid from '@cocreate/uuid';

let crud
if (CRUD && CRUD.default)
	crud = CRUD.default
else
	crud = CRUD

const CoCreateOrganization = {
	init: function() {
		const self = this;
		crud.listen('createOrg', function(data) {
			self.setDocumentId('organizations', data.document[0]._id);
			document.dispatchEvent(new CustomEvent('createdOrg', {
				detail: data
			}));
		});
	},
		
	createOrg: function(btn) {
		let form = btn.closest("form");
		if (!form) return;
		
		let elements = form.querySelectorAll("[collection='organizations'][name]");
		
		let data = {document: {}};
		//. get form data
		elements.forEach(el => {
			let name = el.getAttribute('name');
			let value = el.getValue();
			if (!name || !value) return;
			if (el.getAttribute('data-type') == 'array') {
				value = [value];
			}
			data.document[name] = value;
		});
		
		const socket = crud.socket.getSockets()
		if (!socket[0] || !socket[0].connected || window && !window.navigator.onLine) {
			data.collection = 'organizations'
			data.document['_id'] = ObjectId()
			data.document['name'] = 'untitled'
			window.localStorage.setItem('apiKey', uuid(32));
			window.localStorage.setItem('organization_id', data['_id']);	
			crud.createDocument(data).then((response) => {
				data.database = data.document[0]['_id']
				data.organization_id = data.document[0]['_id']
				crud.createDocument(data).then((response) => {
					
					document.dispatchEvent(new CustomEvent('createOrg', {
						detail: response
					}));
		
				})	
			})
		} else {
			crud.socket.send('createOrg', {
				collection: 'organizations',
				...data
			});
		}
	},
	
	setDocumentId: function(collection, id) {
		let orgIdElements = document.querySelectorAll(`[collection='${collection}']`);
		if (orgIdElements && orgIdElements.length > 0) {
			orgIdElements.forEach((el) => {
				if (!el.getAttribute('document_id')) {
					el.setAttribute('document_id', id);
				}
				if (el.getAttribute('name') == "_id") {
					el.value = id;
				}
			});
		}
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

const ObjectId = (rnd = r16 => Math.floor(r16).toString(16)) =>
    rnd(Date.now()/1000) + ' '.repeat(16).replace(/./g, () => rnd(Math.random()*16));

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