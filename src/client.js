import crud from '@cocreate/crud-client';
// import input from '@cocreate/elements'
import action from '@cocreate/actions';

const CoCreateOrganization = {
	init: function() {
		const self = this;
		crud.listen('createOrg', function(data) {
			self.setDocumentId('organizations', data.document_id);
			document.dispatchEvent(new CustomEvent('createdOrg', {
				detail: data
			}));
		});
	},
		
	createOrg: function(btn) {
		let form = btn.closest("form");
		if (!form) return;
		
		let elements = form.querySelectorAll("[collection='organizations'][name]");
		
		let data = {};
		//. get form data
		elements.forEach(el => {
			let name = el.getAttribute('name');
			let value = el.getValue(el) || el.getAttribute('value');
			if (!name || !value) return;
			if (el.getAttribute('data-type') == 'array') {
				value = [value];
			}
			data[name] = value;
		});
		
		crud.send('createOrg', {
			collection: 'organizations',
			data: data
		});
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
		const { collection, document_id } = crud.getAttr(btn);
		const organization_id = document_id;

		if(crud.checkAttrValue(collection) && crud.checkAttrValue(document_id)) {

			crud.send('deleteOrg', {
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

CoCreateOrganization.init();

export default CoCreateOrganization;