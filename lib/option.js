export default class Option {
	constructor() {
		this.type = null;
		this.name = null;
		this.defaultValue = null;
		this.isRequired = false;
		this.choices = null;
	}

	setName(name) {
		this.name = name;
		return this;
	}

	setDefault(defaultValue) {
		this.defaultValue = defaultValue;
		return this;
	}

	setRequired(isRequired) {
		this.isRequired = isRequired;
		return this;
	}

	addChoices(...choices) {
		this.choices = choices;
		return this;
	}
}
