const {ObjectId} = require("mongodb");

class CoCreateOrganization {
	constructor(wsManager, dbClient) {
		this.wsManager = wsManager
		this.dbClient = dbClient
		this.init()
	}
	
	init() {
		if (this.wsManager) {
			this.wsManager.on('createOrg',		(socket, data, socketInfo) => this.createOrg(socket, data, socketInfo));
			this.wsManager.on('deleteOrg',		(socket, data, socketInfo) => this.deleteOrg(socket, data, socketInfo));
		}
	}

	async createOrg(socket, data, socketInfo) {
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

					self.wsManager.send(socket, 'createOrg', response, socketInfo);
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
	
	
	async deleteOrg(socket, data, socketInfo) {
		const self = this;
		if(!data.data) return;
		try{
			// ToDo: Delete DB and delete org and user from masterDB
		}catch(error){
			console.log('deleteOrg error', error);
		}
	}

}

module.exports = CoCreateOrganization;