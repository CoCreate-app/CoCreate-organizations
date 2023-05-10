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
		try {
			const platformSocket = {
				config: {
					organization_id: process.env.organization_id,
				}
			}

			for(let document of data.documents) {
				document.database = process.env.organization_id
				document.organization_id = process.env.organization_id
				let response = await this.crud.createDocument(document)
				this.wsManager.broadcast(platformSocket, 'createDocument', response);
			}
			this.wsManager.send(socket, 'createOrg', data);
		} catch(error) {
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