const {ObjectId} = require("mongodb");

class CoCreateOrganization {
	constructor(wsManager, dbClient) {
		this.wsManager = wsManager
		this.dbClient = dbClient
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
		if(!data.data) return;
		
		try{
			const collection = this.dbClient.db(data.organization_id).collection(data.collection);
			// create new org in config db organization collection
			// ToDo: if data.data._id create org in platformDB
			collection.insertOne({ ...data.data, organization_id: data.organization_id }, function(error, result) {
				if(!error && result){
					const orgId = `${result.insertedId}`
					data.data['_id'] = result.insertedId
					
					const anotherCollection = self.dbClient.db(orgId).collection(data['collection']);
					// Create new org db and insert organization
					anotherCollection.insertOne({...data.data, organization_id : orgId});
					
					const response  = { ...data, document_id: orgId }

					self.wsManager.send(socket, 'createOrg', response);
					self.wsManager.broadcast(socket, data.namespace || data['organization_id'] , data.room, 'createDocument', response);

					// add new org to platformDB
					if (data.organization_id != process.env.organization_id) {	
						const platformDB = self.dbClient.db(process.env.organization_id).collection(data['collection']);
						platformDB.insertOne({...data.data, organization_id: process.env.organization_id});
					}	
				}
			});
		}catch(error){
			console.log('createDocument error', error);
		}
	}
	
	
	async deleteOrg(socket, data) {
		const self = this;
		if(!data.data) return;
		const organization_id = data.data.organization_id
		if(!organization_id || organization_id == process.env.organization_id) return;
		if(data.organization_id != process.env.organization_id) return;
		try{
			const db = this.dbClient.db(organization_id);
			db.dropDatabase().then(response => {
				if (response === true){
					process.emit('deleteOrg', organization_id)

					// delete org from platformDB
					const platformDB = self.dbClient.db(process.env.organization_id).collection(data['collection']);
					const query = {
						"_id": new ObjectId(organization_id)
					};
		
					platformDB.deleteOne(query, function(error, result) {
						if (!error) {
							let response = { ...data }
							self.wsManager.send(socket, 'deleteOrg', response);
							self.wsManager.broadcast(socket, response.namespace || response['organization_id'], response.room, 'deleteDocument', response);
						} else {
							self.wsManager.send(socket, 'ServerError', error);
						}
					})
				}	
			})
		}catch(error){
			console.log('deleteOrg error', error);
		}
	}

}

module.exports = CoCreateOrganization;