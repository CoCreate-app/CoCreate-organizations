class CoCreateOrganization {
	constructor(crud) {
		this.wsManager = crud.wsManager;
		this.crud = crud;
		this.platformSocket = {
			config: {
				organization_id: process.env.organization_id
			}
		};
		this.init();
	}

	init() {
		if (this.wsManager) {
			this.wsManager.on("createOrganization", (data) =>
				this.createOrganization(data)
			);
			this.wsManager.on("createEnvironments", (data) =>
				this.createEnvironments(data)
			);
		}
	}

	async createOrganization(data) {
		try {
			const { organization, user, key } = data;

			if (
				!organization ||
				!organization._id ||
				!organization.host ||
				!organization.host[0] ||
				!organization.host[0].name
			) {
				this.errorHandler(
					data,
					"invalid_organization: missing required organization fields"
				);
			}

			if (!user || !user._id || !user.email || !user.password) {
				this.errorHandler(
					data,
					"invalid_user: missing required user fields"
				);
			}

			if (!key || !Array.isArray(key) || key.length < 4) {
				this.errorHandler(
					data,
					"invalid_key: An array of 4 keys is required with type key, user and role."
				);
			}

			// If there are validation errors, include them in the response and send immediately
			if (data.success === false) {
				return this.wsManager.send(data);
			}

			const Data = {};
			Data.method = "object.update";
			Data.host = organization.host[0].name;
			Data.database = [organization._id];
			Data.organization_id = organization._id;
			Data.upsert = true;
			if (organization) {
				organization.organization_id = organization._id;
				const response = await this.crud.send({
					...Data,
					array: "organizations",
					object: organization
				});
				if (response.error) {
					this.errorHandler(data, response.error);
				}
			}
			if (user) {
				user.organization_id = organization._id;
				const response = await this.crud.send({
					...Data,
					array: "users",
					object: user
				});
				if (response.error) {
					this.errorHandler(data, response.error);
				}
			}

			if (key) {
				key.forEach(k => {
					k.organization_id = organization._id;
				});
				const response = await this.crud.send({
					...Data,
					array: "keys",
					object: key
				});
				if (response.error) {
					this.errorHandler(data, response.error);
				}
			}

			if (data.success !== false) {
				data.success = true;
			}

			this.wsManager.send(data);
		} catch (error) {
			if (data.socket) {
				this.errorHandler(data, error);
				this.wsManager.send(data);
			}
		}
	}

	async createEnvironments(data) {
		try {
			let { organization, hostname } = data;

			if (!organization) {
				this.errorHandler(
					data,
					"Missing required field: 'organization'. Please provide the organization object to create an organization."
				);
			}
			if (!hostname) {
				this.errorHandler(
					data,
					"Missing required field: 'hostname'. Please provide the hostname to create an organization."
				);
			}

			// If there are validation errors, include them in the response and send immediately
			if (data.success === false) {
				return this.wsManager.send(data);
			}

			const Data = {};
			Data.method = "object.read";
			Data.host = hostname;
			Data.organization_id = organization;
			Data.$filter = { limit: 0 };

			let organizations = await this.crud.send({
				...Data,
				array: "organizations",
				object: []
			});

			if (organizations.error) {
				this.errorHandler(data, organizations.error);
			}

			let users = await this.crud.send({
				...Data,
				array: "users",
				object: []
			});

			if (users.error) {
				this.errorHandler(data, users.error);
			}

			let keys = await this.crud.send({
				...Data,
				array: "keys",
				object: []
			});

			if (keys.error) {
				this.errorHandler(data, keys.error);
			}

			for (let host of hostname) {
				organizations.method = "object.create";
				organizations.host = host;
				organizations = await this.crud.send(organizations);

				users.method = "object.create";
				users.host = host;
				users = await this.crud.send(users);

				keys.method = "object.create";
				keys.host = host;
				keys = await this.crud.send(keys);
			}

			if (data.success !== false) {
				data.success = true;
			}

			this.wsManager.send(data);
		} catch (error) {
			if (data.socket) {
				this.errorHandler(data, error);
				this.wsManager.send(data);
			}
		}
	}

    errorHandler(data, error) {
        data.success = false;
        this.crud.errorHandler(data, error);
	}
}

module.exports = CoCreateOrganization;
