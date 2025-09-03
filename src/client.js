import Crud from "@cocreate/crud-client";
import Action from "@cocreate/actions";
import Elements from "@cocreate/elements";
import Config from "@cocreate/config";
import Indexeddb from "@cocreate/indexeddb";
import uuid from "@cocreate/uuid";

async function generateDB(organization = {}, user = {}, key = []) {
	try {
		// Create organization
		organization._id = organization._id || Crud.ObjectId().toString();
		organization.name = organization.name || "untitiled";

		// Create user
		user._id = user._id || Crud.ObjectId().toString();
		user.firstname = user.firstname || "untitiled";
		user.lastname = user.lastname || "untitiled";

		// Create default key
		let defaultKey = {
			_id: Crud.ObjectId().toString(),
			type: "key",
			key: uuid.generate(),
			actions: {
				signIn: true,
				signUp: true
			},
			default: true
		};

		// Create role
		let role_id = Crud.ObjectId().toString();
		let role = {
			_id: role_id,
			type: "role",
			name: "admin",
			admin: "true"
		};

		// Create user key
		let userKey = {
			_id: Crud.ObjectId().toString(),
			type: "user",
			key: user._id,
			array: "users", // could be any array
			roles: [role_id],
			email: user.email,
			password: user.password || btoa("0000")
		};

		return {
			organization,
			user,
			key: [defaultKey, userKey, role]
		};
	} catch (error) {
		return false;
	}
}

function saveLocally(objects) {
	const organization_id = objects.organization._id;
	for (let key of Object.keys(objects)) {
		let data = {
			method: "object.create",
			storage: "indexeddb",
			database: organization_id,
			array: key + "s",
			object: objects[key],
			organization_id
		};
		Indexeddb.send(data);
	}
}

async function get() {
	let organization_id = await getOrganizationFromServiceWorker();
	if (!organization_id) {
		let data = await Indexeddb.send({ method: "database.read" });
		for (let database of data.database) {
			let name = database.name;
			if (name.match(/^[0-9a-fA-F]{24}$/)) {
				organization_id = name;
			}
		}
	}

	if (!organization_id) {
		let file = await fetch("/");
		organization_id = file.headers.get("organization");
	}

	if (!organization_id) organization_id = await createOrganization();

	if (organization_id) Config.set("organization_id", organization_id);

	return organization_id;
}

async function getOrganizationFromServiceWorker() {
	return new Promise((resolve, reject) => {
		if (!navigator.serviceWorker) return resolve();

		const handleMessage = (event) => {
			if (event.data.action === "getOrganization") {
				navigator.serviceWorker.removeEventListener(
					"message",
					handleMessage
				); // Remove the event listener
				resolve(event.data.organization_id);
			}
		};

		navigator.serviceWorker.addEventListener("message", handleMessage);

		// Send message to Service Worker
		const msg = new MessageChannel();

		navigator.serviceWorker.ready
			.then((registration) => {
				if (navigator.serviceWorker.controller) {
					// If there's an active controller, send the message
					navigator.serviceWorker.controller.postMessage(
						{ action: "getOrganization" },
						[msg.port1]
					);
				} else {
					// Listen for a new service worker to start controlling the page
					navigator.serviceWorker.addEventListener(
						"controllerchange",
						() => {
							if (navigator.serviceWorker.controller) {
								navigator.serviceWorker.controller.postMessage(
									{ action: "getOrganization" },
									[msg.port1]
								);
							}
						}
					);
				}
			})
			.catch((error) => {
				console.error(reject);
			});
	});
}

let organizationPromise = null;
async function createOrganizationPromise() {
	let createOrganization = document.querySelector(
		'[actions*="createOrganization"]'
	);
	if (createOrganization) return (Crud.socket.organization = "canceled");

	if (
		Crud.socket.organization == "canceled" ||
		Crud.socket.organization == "pending"
	)
		return;

	const organization_id = prompt(
		"An organization_id could not be found, if you already have an organization_id input it now.\n\nOr leave blank and click 'OK' to create a new organization"
	);

	if (organization_id) return organization_id;
	if (organization_id === null)
		return (Crud.socket.organization = "canceled");

	Crud.socket.organization = "pending";
	if (Indexeddb) {
		try {
			let org = { object: {} };
			if (organization_id) org.object._id = organization_id;
			let { organization, user, key } = await generateDB(org);
			if (organization && apikey && user) {
				Crud.socket.apikey = key[0];
				Crud.socket.user_id = user._id;
				Config.set("organization_id", organization._id);
				Config.set("apikey", key[0]);
				Config.set("user_id", user._id);
				Crud.socket.organization = true;
				return organization._id;
			}
		} catch (error) {
			console.error("Failed to load the script:", error);
		}
	}
}

async function createOrganization() {
	return (
		organizationPromise ||
		(organizationPromise = createOrganizationPromise())
	);
}

async function create(action) {
	let form = action.form;
	if (!form) return;

	let data = await Elements.getData(form);

	let organization, user;
	if (Array.isArray(data)) {
		for (const item of data) {
			if (item.array === "organizations") {
				organization = item;
			}
			if (item.array === "users") {
				user = item;
			}
			if (organization && user) {
				break;
			}
		}
	}

	organization.method = "object.read";
	organization = await Crud.send(organization);

	user.method = "object.read";
	user = await Crud.send(user);

	if (organization && organization.object && organization.object[0]) {
		organization = organization.object[0];
	}
	if (user && user.object && user.object[0]) {
		user = user.object[0];
	}

	let objects = await generateDB(organization, user);

	let organization_id = organization._id || objects.organization._id;

	if (Crud.socket.organization !== true) {
		Crud.socket.organization = true;
		Crud.socket.create({ organization_id });
	}

	let response = await Crud.socket.send({
		method: "createOrganization",
		...objects,
		broadcastBrowser: false
	});

	action.element.dispatchEvent(
		new CustomEvent("createdOrganization", {
			detail: response
		})
	);
}

Action.init({
	name: "createOrganization",
	endEvent: "createdOrganization",
	callback: (action) => {
		create(action);
	}
});

export default { generateDB, create, get };
