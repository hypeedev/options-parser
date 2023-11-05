import Option from "./option.js";

export default class FlagOption extends Option {
	constructor() {
		super();
		this.type = "flag";
		this.defaultValue = false;
	}
}
