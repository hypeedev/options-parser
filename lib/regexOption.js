import Option from "./option.js";

export default class RegexOption extends Option {
	constructor() {
		super();
		this.type = "regex";
		this.regex = null;
	}

	setRegex(regex) {
		this.regex = regex;
		return this;
	}
}
