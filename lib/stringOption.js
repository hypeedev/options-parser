import Option from "./option.js";
import gestaltSimilarity from "./gestaltSimilarity.js";

export default class StringOption extends Option {
	constructor() {
		super();
		this.type = "string";
		this.minLength = 0;
		this.maxLength = Infinity;
		this.allowSpaces = false;
	}

	setMinLength(minLength) {
		this.minLength = minLength;
		return this;
	}

	setMaxLength(maxLength) {
		this.maxLength = maxLength;
		return this;
	}

	setAllowSpaces(allowSpaces = true) {
		this.allowSpaces = allowSpaces;
		return this;
	}

	parse(command, part) {
		if (this.choices) {
			const mostSimilar = { option: null, value: null, similarity: 0 };
			let found = false;
			for (const { value, matches } of this.choices) {
				for (const match of matches) {
					if (command.checkGestaltSimilarity) {
						const similarity = gestaltSimilarity(part, match);
						if (similarity > mostSimilar.similarity) {
							mostSimilar.option = this;
							mostSimilar.value = value;
							mostSimilar.similarity = similarity;
						}
					} else {
						if (part === match) {
							mostSimilar.option = this;
							mostSimilar.value = value;
							mostSimilar.similarity = 1;
							break;
						}
					}

					if (mostSimilar.similarity === 1) {
						found = true;
						break;
					}
				}
				if (found) break;
			}

			if (command.gestaltSimilarityThreshold && mostSimilar.similarity < command.gestaltSimilarityThreshold) {
				throw new Error(`String option '${this.name}' is not recognized.`);
			}

			return mostSimilar.value;
		}

		if (this.minLength && part.length < this.minLength) {
			throw new Error(`String option '${this.name}' requires at least ${this.minLength} characters.`);
		} else if (this.maxLength && part.length > this.maxLength) {
			throw new Error(`String option '${this.name}' requires at most ${this.maxLength} characters.`);
		}

		return part;
	}
}
