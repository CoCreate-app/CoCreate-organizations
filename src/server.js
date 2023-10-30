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
            this.wsManager.on('createOrganization', (data) =>
                this.createOrganization(data)
            );
        }
    }

    async createOrganization(data) {
        try {
            if (!data.organization || !data.organization._id) return
            if (!data.user || !data.user._id || !data.user.email || !data.user.password) return

            const organization = {
                _id: data.organization._id,
                name: data.organization.name || 'untitled',
                host: data.organization.host || [],
                owner: data.user._id,
                balance: 10, // TODO: set balance to 0 and create a transcation with type credit to add the $10
                dataTransfered: 0
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
                email: user.object.email,
                password: user.object.password || btoa('0000'),
                user: {
                    array: 'users'
                }
            }

            const Data = {}
            Data.method = 'object.create'
            Data.database = process.env.organization_id
            Data.organization_id = process.env.organization_id

            if (organization) {
                const response = await this.crud.send({ ...Data, array: 'organizations', object: organization })
                this.wsManager.send(this.platformSocket, response);
            }
            if (user) {
                const response = await this.crud.send({ ...Data, array: 'users', object: user })
                this.wsManager.send(this.platformSocket, response);
            }

            if (userKey) {
                const response = await this.crud.send({ ...Data, array: 'keys', object: userKey })
                this.wsManager.send(this.platformSocket, response);
            }

            this.wsManager.send(data);
        } catch (error) {
            console.log('createObject error', error);
        }
    }
}

module.exports = CoCreateOrganization;