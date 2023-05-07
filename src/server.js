class CoCreateOrganization {
	constructor(crud) {
		this.wsManager = crud.wsManager
		this.crud = crud
		this.init()
	}
	
	init() {
		if (this.wsManager) {
			this.wsManager.on('createOrg', (socket, data) => 
				this.createOrg(socket, data)
			);
			this.wsManager.on('deleteOrg', (socket, data) => 
				this.deleteOrg(socket, data)
			);
		}
	}

	async createOrg(socket, data) {
		const self = this;
		
		try{
			// create new org in config db organization collection
			this.crud.createDocument(data).then((data) => {
				// const orgId = `${data.document[0]._id}`
				
				// Create new org db and insert organization
				// self.crud.createDocument({...data, database: orgId, organization_id: orgId}).then((data) => {
				// 	self.wsManager.send(socket, 'createOrg', data);
				// 	self.wsManager.broadcast(socket, 'createDocument', data);	
				// })

				self.wsManager.broadcast(socket, 'updateDocument', data);	
				self.wsManager.send(socket, 'createOrg', data);

				// add new org to platformDB
				if (data.organization_id != process.env.organization_id) {	
					self.crud.createDocument({ ...data, database: process.env.organization_id, organization_id: process.env.organization_id })
				}
	
			})
		}catch(error){
			console.log('createDocument error', error);
		}
	}
	
	
	async deleteOrg(socket, data) {
		const self = this;
		const organization_id = data.data.organization_id
		if (!organization_id || organization_id == process.env.organization_id) return;
		if (data.organization_id != process.env.organization_id) return;

		try {
			this.crud.deleteDatabase(data).then((response) => {
				if (response === true){
					process.emit('deleteOrg', organization_id)
					self.wsManager.send(socket, 'deleteOrg', data);
					
					// delete org from platformDB
					const request = {
						database: process.env.organization_id, 
						collection: 'organization',
						document: {
							_id: organization_id
						},
						organization_id: process.env.organization_id
					};
		
					self.crud.deleteDocument(request).then((data) => {
						self.wsManager.broadcast(socket, 'deleteDocument', data)
					})
				}	

			})
			
		}catch(error){
			console.log('deleteOrg error', error);
		}
	}

}

module.exports = CoCreateOrganization;