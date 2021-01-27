const CoCreateOrganization = {
	masterDB: '5ae0cfac6fb8c4e656fdaf92', // '5ae0cfac6fb8c4e656fdaf92' /** masterDB **/,
	init: function() {
		const self = this;
		CoCreateSocket.listen('createOrg', function(data) {
			self.setDocumentId('organizations', data.document_id);
			document.dispatchEvent(new CustomEvent('createdOrg', {
				detail: data
			}))
		})
		
		CoCreateSocket.listen('createUser', function(data) {
			self.setDocumentId('users', data.document_id);
			document.dispatchEvent(new CustomEvent('createdUser', {
				detail: data
			}))
		})
		
		CoCreateSocket.listen('runIndustry', function(data) {
			self.runIndustryProcess(data)
			document.dispatchEvent(new CustomEvent('runIndustry', {
				detail: data
			}))
		})
		
		CoCreateSocket.listen('createIndustryNew', function(data) {
			console.log(data)
			document.dispatchEvent(new CustomEvent('createIndustry', {
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
			let value = CoCreateInput.getValue(el) || el.getAttribute('value')
			if (!name || !value) return;
			if (el.getAttribute('data-type') == 'array') {
				value = [value];
			}
			data[name] = value;
		})
		const room = CoCreate.generateSocketClient();
		
		CoCreateSocket.send('createOrg', {
			apiKey: config.apiKey,
			securityKey: config.securityKey,
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
			let value = CoCreateInput.getValue(el) || el.getAttribute('value')
			if (!name || !value) return;
			
			if (el.getAttribute('data-type') == 'array') {
				value = [value];
			}
			data[name] = value;
		})
		data['current_org'] = org_id;
		data['connected_orgs'] = [org_id];
		data['organization_id'] = org_id || config.organization_Id;
		
		const room = CoCreate.generateSocketClient();

		CoCreateSocket.send('createUser', {
			apiKey: config.apiKey,
			securityKey: config.securityKey,
			organization_id: config.organization_Id,
			db: this.masterDB,
			collection: 'users',
			data: data,
			copyDB: org_id
		}, room);
	},
	
	/** run industry action **/
	runIndustry: function(btn) {
		const form = btn.closest('form')
		if (!form) return;
		
		const industrySelect = form.querySelector("cocreate-select[name='industry']")
		if (industrySelect) {
			const industry_id = CoCreateSelect.getValue(industrySelect)
			
			const newOrgId = industrySelect.getAttribute('data-document_id');
			
			if (industry_id && newOrgId) {
				CoCreateSocket.send('runIndustry', {
					apiKey: config.apiKey,
					securityKey: config.securityKey,
					organization_id: config.organization_Id,
					industry_id: industry_id,
					new_organization_id: newOrgId,
					db: this.masterDB
				})
			}
			
		}
	},
	
	runIndustryProcess: function(data) {
		const industryBtn = document.querySelector('[data-actions]');
		if (industryBtn) {
			const form = industryBtn.form;
			if (!form) return;
			
			const industrySelect = form.querySelector("cocreate-select[name='industry']");
			if (industrySelect) {
				const industry_id = CoCreateSelect.getValue(industrySelect)
				const newOrgId = industrySelect.getAttribute('data-document_id');
				if (industry_id == data['industry_id'] && newOrgId) {
					const apiKeyInput = form.querySelector("input[name='apiKey']");
					const securityKeyInput = form.querySelector("input[name='securityKey']");
					
					// CoCreate.updateDocument({
					// 	collection: 'organizations',
					// 	document_id: newOrgId,
					// 	data: {
					// 		adminUI_id: data['adminUI_id'],
					// 		builderUI_id: data['builderUI_id']
					// 	}
					// })
				}
			}
		}
		
		if (data['adminUI_id']) 
			localStorage.setItem('adminUI_id', data['adminUI_id']);

		if (data['builderUI_id']) 
			localStorage.setItem('builderUI_id', data['builderUI_id']);
		
		// document.dispatchEvent(new CustomEvent('runIndustry'), {
		// 	detail: data
		// })

	},
	
	createIndustryDocument: function(btn) {
		let form = btn.closest("form");
		if (!form) return;
		
		let elements = form.querySelectorAll("[data-collection='industries'][name]");
		
		let data = {};
		//. get form data
		elements.forEach(el => {
			let name = el.getAttribute('name')
			let value = CoCreateInput.getValue(el) || el.getAttribute('value')
			if (!name || !value) return;
			if (el.getAttribute('data-type') == 'array') {
				value = [value];
			}
			data[name] = value;
		})
		
		const room = CoCreate.generateSocketClient();
		console.log(data);
		
		data['organization_id'] = config.organization_Id;
		
		// return;
		CoCreateSocket.send('createIndustryNew', {
			apiKey: config.apiKey,
			securityKey: config.securityKey,
			organization_id: config.organization_Id,
			db: this.masterDB,
			collection: 'industries',
			data: data
		}, room);
	},
}

CoCreateOrganization.init();
CoCreateAction.registerEvent("createOrg", CoCreateOrganization.createOrg, CoCreateOrganization, "createdOrg");
CoCreateAction.registerEvent("createUser", CoCreateOrganization.createUser, CoCreateOrganization, "createdUser");
CoCreateAction.registerEvent("runIndustry", CoCreateOrganization.runIndustry, CoCreateOrganization, "runIndustry");
CoCreateAction.registerEvent("createIndustry", CoCreateOrganization.createIndustryDocument, CoCreateOrganization, "createdIndustry");

export default CoCreateOrganization;