import crud from '@cocreate/crud-client';
import input from '@cocreate/input'
import action from '@cocreate/action'

const CoCreateOrganization = {
	masterDB: '5ae0cfac6fb8c4e656fdaf92', // '5ae0cfac6fb8c4e656fdaf92' /** masterDB **/,
	init: function() {
		
		if (config.organization_Id) {
			this.masterDB = config.organization_Id;
		}
		const self = this;
		crud.listen('createOrg', function(data) {
			self.setDocumentId('organizations', data.document_id);
			document.dispatchEvent(new CustomEvent('createdOrg', {
				detail: data
			}))
		})
		
		crud.listen('createUser', function(data) {
			self.setDocumentId('users', data.document_id);
			document.dispatchEvent(new CustomEvent('createdUser', {
				detail: data
			}))
		})
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
			db: this.masterDB,
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

	createUser: function(btn, reqData) {
		let form = btn.closest("form");
		if (!form) return;
		let org_id = "";
		let elements = form.querySelectorAll("[data-collection='users'][name]");
		let orgIdElement = form.querySelector("input[data-collection='organizations'][name='_id']");
		
		if (orgIdElement) {
			org_id = orgIdElement.value;
		}
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
		data['current_org'] = org_id;
		data['connected_orgs'] = [org_id];
		data['organization_id'] = org_id || config.organization_Id;
		
		const room = config.organization_Id;

		crud.socket.send('createUser', {
			apiKey: config.apiKey,
			organization_id: config.organization_Id,
			db: this.masterDB,
			collection: 'users',
			data: data,
			copyDB: org_id
		}, room);
	},
	
}

CoCreateOrganization.init();

action.init({
	action: "createOrg",
	endEvent: "createdOrg",
	callback: (btn, data) => {
		CoCreateOrganization.createOrg(btn)
	},
})

action.init({
	action: "createUser",
	endEvent: "createdUser",
	callback: (btn, data) => {
		CoCreateOrganization.createUser(btn)
	},
})

export default CoCreateOrganization;