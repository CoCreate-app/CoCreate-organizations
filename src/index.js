import crud from '@cocreate/crud-client';
import input from '@cocreate/input'
import action from '@cocreate/action'

const CoCreateOrganization = {
	// masterDB: '5ae0cfac6fb8c4e656fdaf92', // '5ae0cfac6fb8c4e656fdaf92' /** masterDB **/,
	init: function() {
		const self = this;
		crud.listen('createOrgNew', function(data) {
			document.dispatchEvent(new CustomEvent('createdOrg', {
				detail: data
			}))
		})
		crud.listen('createOrg', function(data) {
			self.setDocumentId('organizations', data.document_id);
			document.dispatchEvent(new CustomEvent('createdOrg', {
				detail: data
			}))
		})
	},
	
	createOrgNew: function(btn) {
		let form = btn.closest("form");
		if (!form) return;
		let newOrg_id = form.querySelector("input[data-collection='organizations'][name='_id']");

		const room = config.organization_Id;

		crud.socket.send('createOrgNew', {
			apiKey: config.apiKey,
			organization_id: config.organization_Id,
			collection: 'organizations',
			newOrg_id: newOrg_id,
		}, room);

	},
	
	createOrg: function(btn) {
		let form = btn.closest("form");
		if (!form) return;
		
		let elements = form.querySelectorAll("[data-collection='organizations'][name]");
		
		let data = {};
		//. get form data
		elements.forEach(el => {
			let name = el.getAttribute('name')
			let value = input.getValue(el) || el.getAttribute('value')
			if (!name || !value) return;
			if (el.getAttribute('data-type') == 'array') {
				value = [value];
			}
			data[name] = value;
		})
		const room = config.organization_Id;
		
		crud.socket.send('createOrg', {
			apiKey: config.apiKey,
			organization_id: config.organization_Id,
			// orgDb: newOrg,
			mdb: '5ae0cfac6fb8c4e656fdaf92',
			collection: 'organizations',
			data: data
		}, room);
	},
	
	setDocumentId: function(collection, id) {
		let orgIdElements = document.querySelectorAll(`[data-collection='${collection}']`);
		if (orgIdElements && orgIdElements.length > 0) {
			orgIdElements.forEach((el) => {
				if (!el.getAttribute('data-document_id')) {
					el.setAttribute('data-document_id', id);
				}
				if (el.getAttribute('name') == "_id") {
					el.value = id;
				}
			})
		}
	},

}

CoCreateOrganization.init();

action.init({
	action: "createOrgNew",
	endEvent: "createdOrg",
	callback: (btn, data) => {
		CoCreateOrganization.createOrgNew(btn)
	},
})
action.init({
	action: "createOrg",
	endEvent: "createdOrg",
	callback: (btn, data) => {
		CoCreateOrganization.createOrg(btn)
	},
})

export default CoCreateOrganization;