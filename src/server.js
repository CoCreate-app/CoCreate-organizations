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
			const errors = [];

			if (!data.organization || !data.organization._id) return;
			if (
				!data.user ||
				!data.user._id ||
				!data.user.email ||
				!data.user.password
			)
				return;

			let { organization, user, key } = data;

			if (
				!organization.host ||
				!organization.host[0] ||
				!organization.host[0].name
			)
				return;

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
					errors.push(response.error);
				}
			}
			if (user) {
				const response = await this.crud.send({
					...Data,
					array: "users",
					object: user
				});
				if (response.error) {
					errors.push(response.error);
				}
			}

			if (key) {
				const response = await this.crud.send({
					...Data,
					array: "keys",
					object: key
				});
				if (response.error) {
					errors.push(response.error);
				}
			}

			if (errors.length) {
				data.error = errors;
			} else {
				data.success = true;
			}

			this.wsManager.send(data);
		} catch (error) {
			if (data.socket) {
				this.crud.errorHandler(data, error);
				this.wsManager.send(data);
			}
		}
	}
}

module.exports = CoCreateOrganization;
