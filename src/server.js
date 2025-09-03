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

			if (!key || !Array.isArray(key) || key.length !== 3) {
				this.errorHandler(
					data,
					"invalid_key: An array of 3 keys is required with type key, user and role."
				);
			}

			// If there are validation errors, include them in the response and send immediately
			if (data.success === false) {
				return this.wsManager.send(data);
			}

			const Data = {};
			Data.method = "object.create";
			Data.host = organization.host[0].name;
			Data.database = organization._id;
			Data.organization_id = organization._id;

			if (organization) {
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

    errorHandler(data, error) {
        data.success = false;
        this.crud.errorHandler(data, error);
	}
}

module.exports = CoCreateOrganization;
