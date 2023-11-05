import Option from "./option.js";

export default class NumberOption extends Option {
	constructor() {
		super();
		this.type = "number";
		this.minValue = -Infinity;
		this.maxValue = Infinity;
	}

	setMinValue(minValue) {
		this.minValue = minValue;
		return this;
	}

	setMaxValue(maxValue) {
		this.maxValue = maxValue;
		return this;
	}

	parse(command, part) {
		const number = Number(part);

		if (isNaN(number)) {
			throw new Error(`Number option '${this.name}' requires a number.`);
		}

		if (this.minValue && number < this.minValue) {
			throw new Error(`Number option '${this.name}' requires a number greater than or equal to ${this.minValue}.`);
		} else if (this.maxValue && number > this.maxValue) {
			throw new Error(`Number option '${this.name}' requires a number less than or equal to ${this.maxValue}.`);
		}

		return number;
	}
}
