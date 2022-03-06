const {ObjectID} = require("mongodb");

class CoCreateOrganization {
	constructor(wsManager, dbClient) {
		this.wsManager = wsManager
		this.dbClient = dbClient
		this.init()
	}
	
	init() {
		if (this.wsManager) {
			this.wsManager.on('createOrgNew',	(socket, data, roomInfo) => this.createOrgNew(socket, data));
			this.wsManager.on('createOrg',		(socket, data, roomInfo) => this.createOrg(socket, data));
			this.wsManager.on('deleteOrg',		(socket, data, roomInfo) => this.deleteOrg(socket, data));
		}
	}

	async createOrgNew(socket, data) {
		const self = this;
		if(!data) return;
		const newOrg_id = data.newOrg_id;
		if (newOrg_id != data.organization_id) {
			try{
				const db = this.dbClient.db(req_data['organization_id']);
				const collection = db.collection(req_data["collection"]);
					const query = {
					"_id": new ObjectID(newOrg_id)
				};
			
				collection.find(query).toArray(function(error, result) {
					if(!error && result){
						const newOrgDb = self.dbClient.db(newOrg_id).collection(data['collection']);
						// Create new user in config db users collection
						newOrgDb.insertOne({...result.ops[0], organization_id : newOrg_id}, function(error, result) {
							if(!error && result){
								const response  = { ...data, document_id: result.ops[0]._id, data: result.ops[0]}
								self.wsManager.send(socket, 'createOrgNew', response, data['organization_id']);
							}
						});
					}
				});
			}catch(error){
				console.log('createDocument error', error);
			}
		}
	}

	async createOrg(socket, data) {
		const self = this;
		if(!data.data) return;
		
		try{
			const collection = this.dbClient.db(data.organization_id).collection(data.collection);
			// create new org in config db organization collection
			collection.insertOne({ ...data.data, organization_id: data.organization_id }, function(error, result) {
				if(!error && result){
					const orgId = result.ops[0]._id + "";
					const anotherCollection = self.dbClient.db(orgId).collection(data['collection']);
					// Create new org db and insert organization
					anotherCollection.insertOne({...result.ops[0], organization_id : orgId});
					
					const response  = { ...data, document_id: result.ops[0]._id, data: result.ops[0] }

					self.wsManager.send(socket, 'createOrg', response );
					self.wsManager.broadcast(socket, data.namespace || data['organization_id'] , data.room, 'createDocument', response);
				}
					// add new org to masterDb
					const masterOrgDb = self.dbClient.db(data.mdb).collection(data['collection']);
					masterOrgDb.insertOne({...result.ops[0], organization_id : data['mdb']});

			});
		}catch(error){
			console.log('createDocument error', error);
		}
	}
	
	
	async deleteOrg(socket, data) {
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