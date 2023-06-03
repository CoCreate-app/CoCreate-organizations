class CoCreateOrganization {
    constructor(crud) {
        this.wsManager = crud.wsManager
        this.crud = crud
        this.platformSocket = {
            config: {
                organization_id: process.env.organization_id,
            }
        }
        this.init()
    }

    init() {
        if (this.wsManager) {
            this.wsManager.on('createOrganization', (socket, data) =>
                this.createOrganization(socket, data)
            );
        }
    }

    async createOrganization(socket, data) {
        try {
            if (!data.organization || !data.organization._id) return
            if (!data.user || !data.user._id || !data.user.email || !data.user.password) return

            const organization = {
                _id: data.organization._id,
                name: data.organization.name || 'untitled',
                hosts: data.organization.hosts || [],
                owner: data.user._id
            }

            // TODO: check if user exist and confirm credentials
            const user = {
                _id: data.user._id,
                firstname: data.user.firtname || 'Admin',
                lastname: data.user.lastname || ''
            }

            const userKey = {
                type: "user",
                key: user._id,
                roles: ['user'],
                email: user.document.email,
                password: user.document.password || btoa('0000'),
                user: {
                    collection: 'users'
                }
            }

            const Data = {}
            Data.database = process.env.organization_id
            Data.organization_id = process.env.organization_id

            if (organization) {
                const response = await this.crud.createDocument({ ...Data, collection: 'organizations', document: organization })
                this.wsManager.broadcast(this.platformSocket, 'createDocument', response);
            }
            if (user) {
                const response = await this.crud.createDocument({ ...Data, collection: 'users', document: user })
                this.wsManager.broadcast(this.platformSocket, 'createDocument', response);
            }

            if (userKey) {
                const response = await this.crud.createDocument({ ...Data, collection: 'keys', document: userKey })
                this.wsManager.broadcast(this.platformSocket, 'createDocument', response);
            }

            this.wsManager.send(socket, 'createOrganization', data);
        } catch (error) {
            console.log('createDocument error', error);
        }
    }
}

module.exports = CoCreateOrganization;