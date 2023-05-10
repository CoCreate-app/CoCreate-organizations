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
	
}

module.exports = CoCreateOrganization;