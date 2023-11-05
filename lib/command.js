import { FlagOption, NumberOption, RegexOption, StringOption } from "./options.js";
import gestaltSimilarity from "./gestaltSimilarity.js";
// import Benchmark from "benchmark";

class Command {
	constructor({
		flagPrefix = "-",
		checkGestaltSimilarity = false,
		gestaltSimilarityThreshold = 0.75
	} = {}) {
		this.flagPrefix = flagPrefix;
		this.checkGestaltSimilarity = checkGestaltSimilarity;

		if (gestaltSimilarityThreshold < 0 || gestaltSimilarityThreshold > 1) {
			throw new Error("Gestalt similarity threshold must be between 0 and 1.");
		}
		this.gestaltSimilarityThreshold = gestaltSimilarityThreshold;

		this.name = null;
		this.description = null;
		this.aliases = [];

		this.regexOptions = [];
		this.flagOptions = [];
		this.options = [];
	}

	setName(name) {
		this.name = name;
		return this;
	}

	setDescription(description) {
		this.description = description;
		return this;
	}

	setAlias(alias) {
		this.aliases = [ alias ];
		return this;
	}

	setAliases(...aliases) {
		this.aliases = aliases;
		return this;
	}

	getUsage() {
		const usage = [];

		for (const option of this.options) {
			let name = option.name;
			if (option.type === "number") {
				if (option.minValue || option.maxValue) {
					name = `${name}: ${option.minValue ?? ""}..${option.maxValue ?? ""}`;
				}
			} else if (option.type === "string") {
				if (option.minLength || option.maxLength) {
					name = `${name}: ${option.minLength ?? ""}-${option.maxLength ?? ""}`;
				}
			}
			usage.push(option.isRequired ? `<${name}>` : `[${name}]`);
		}

		for (const option of this.flagOptions) {
			const choices = option.choices?.map(({ value, matches }) => `${this.flagPrefix}${matches[0]}`).join("/");

			if (option.isRequired) {
				usage.push(`<${choices}>`);
			}
			usage.push(option.isRequired ? `<${choices}>` : `[${choices}]`);
		}

		for (const option of this.regexOptions) {
			usage.push(`[${option.name}]`);
		}

		return usage.join(" ");
	}

	#addOption(option) {
		if (option instanceof FlagOption) {
			this.flagOptions.push(option);
		} else if (option instanceof RegexOption) {
			this.regexOptions.push(option);
		} else {
			this.options.push(option);
		}
		return this;
	}

	addStringOption(callback) {
		const option = callback(new StringOption());
		if (this.options[this.options.length - 1]?.allowSpaces) {
			throw new Error(`String option '${this.options[this.options.length - 1].name}' allows spaces, so no more options can be added.`);
		}
		return this.#addOption(option);
	}

	addNumberOption(callback) {
		const option = callback(new NumberOption());
		if (this.options[this.options.length - 1]?.allowSpaces) {
			throw new Error(`String option '${this.options[this.options.length - 1].name}' allows spaces, so no more options can be added.`);
		}
		return this.#addOption(option);
	}

	addFlagOption(callback) {
		const option = callback(new FlagOption());
		if (option.choices === undefined) {
			throw new Error(`Flag option '${option.name}' requires choices.`);
		}
		return this.#addOption(option);
	}

	addRegexOption(callback) {
		const option = callback(new RegexOption());
		if (option.regex === undefined) {
			throw new Error(`Regex option '${option.name}' requires a regex.`);
		}
		return this.#addOption(option);
	}

	parse(string) {
		string = string.trim();

		const allOptions = [ ...this.options, ...this.flagOptions, ...this.regexOptions ];
		const options = Object.fromEntries(allOptions.map(option => [ option.name, option.defaultValue ]));

		if (string === "") {
			const requiredOptions = allOptions.filter(option => option.isRequired);
			if (requiredOptions.length > 0) {
				throw new Error(`Missing required arguments: ${requiredOptions.map(option => option.name).join(", ")}.`);
			}
			return options;
		}

		let optionsIndex = 0;

		const parts = string.split(/\s+/);
		for (let part of parts) {
			if (this.checkRegexOptions(part, options)) continue;
			if (this.checkFlagOptions(part, options)) continue;

			const option = this.options[optionsIndex++];
			if (option === undefined) {
				throw new Error(`Too many arguments.`);
			}

			if (option.type === "string" && option.allowSpaces) {
				part = parts.splice(optionsIndex - 1, parts.length - optionsIndex).join(" ");

				const nextPart = parts[0];
				const nextOption = this.options[optionsIndex];
				if (nextOption.type === "number" && isNaN(nextPart)) {
					part += " " + parts.shift();
				}
			}

			options[option.name] = option.parse(this, part);
		}

		if (this.options.length > optionsIndex) {
			const requiredOptions = this.options.slice(optionsIndex).filter(option => option.isRequired);
			if (requiredOptions.length > 0) {
				throw new Error(`Missing required arguments: ${requiredOptions.map(option => option.name).join(", ")}.`);
			}
		}

		return options;
	}

	checkFlagOptions(part, options) {
		let flagFound = false;
		if (part.startsWith(this.flagPrefix)) {
			const flag = part.slice(this.flagPrefix.length);

			const mostSimilar = { option: null, value: null, similarity: 0 };
			let found = false;

			for (const flagOption of this.flagOptions) {
				for (const { value, matches } of flagOption.choices) {
					for (const match of matches) {
						if (this.checkGestaltSimilarity) {
							const similarity = gestaltSimilarity(flag, match);
							if (similarity > mostSimilar.similarity) {
								mostSimilar.option = flagOption;
								mostSimilar.value = value;
								mostSimilar.similarity = similarity;
							}
						} else {
							if (flag === match) {
								mostSimilar.option = flagOption;
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
				if (found) break;
			}

			if (this.gestaltSimilarityThreshold && mostSimilar.similarity < this.gestaltSimilarityThreshold) {
				throw new Error(`Flag option '${flag}' is not recognized.`);
			}

			if (options[mostSimilar.option.name] !== mostSimilar.option.defaultValue) {
				throw new Error(`Flag option '${mostSimilar.option.name}' is already defined.`);
			}

			options[mostSimilar.option.name] = mostSimilar.value;
			flagFound = true;
		}
		return flagFound;
	}

	checkRegexOptions(part, options) {
		let regexFound = false;
		for (const regexOption of this.regexOptions) {
			const matches = part.match(regexOption.regex)?.slice(1);
			if (matches?.length) {
				if (options[regexOption.name] !== regexOption.defaultValue) {
					throw new Error(`Regex option '${regexOption.name}' is already defined.`);
				}
				options[regexOption.name] = matches;
				regexFound = true;
				break;
			}
		}
		return regexFound;
	}
}

// const command = new Command({ checkGestaltSimilarity: true })
// 	.addStringOption(option => option
// 		.setName("regex1"))
// 	.addStringOption(option => option
// 		.setName("regex2"))
// 	.addFlagOption(option => option
// 		.setName("language")
// 		.addChoices(
// 			{ value: "english", matches: [ "en", "english" ] },
// 			{ value: "french", matches: [ "fr", "french" ] },
// 			{ value: "spanish", matches: [ "es", "spanish" ] },
// 			{ value: "italian", matches: [ "it", "italian" ] },
// 			{ value: "portuguese", matches: [ "pt", "portuguese", "brpt", "ptbr" ] },
// 			{ value: "german", matches: [ "de", "german" ] },
// 			{ value: "breton", matches: [ "br", "breton" ] },
// 			{ value: "nahuatl", matches: [ "nah", "nahuatl" ] }
// 		))
// 	.addFlagOption(option => option
// 		.setName("sn")
// 		.addChoices({ value: true, matches: [ "sn" ] }))
// 	.addFlagOption(option => option
// 		.setName("minerals")
// 		.addChoices({ value: true, matches: [ "minerals", "mi" ] }))
// 	.addFlagOption(option => option
// 		.setName("phobias")
// 		.addChoices({ value: true, matches: [ "phobias", "phob" ] }))
// 	.addFlagOption(option => option
// 		.setName("chemicals")
// 		.addChoices({ value: true, matches: [ "chemicals", "chem" ] }))
// 	.addFlagOption(option => option
// 		.setName("foods")
// 		.addChoices({ value: true, matches: [ "foods" ] }))
// 	.addFlagOption(option => option
// 		.setName("creatures")
// 		.addChoices({ value: true, matches: [ "creatures", "crea" ] }))
// 	.addRegexOption(option => option
// 		.setName("min")
// 		.setRegex(/^(?:-(?:\+|min|sup)|\+)?(\d+)$/i))
// 	.addRegexOption(option => option
// 		.setName("max")
// 		.setRegex(/^-(?:max|sub)?(\d+)$/i));
//
// const options = command.parse("a b -en -sn -9");
// console.log(options);

// (new Benchmark.Suite)
// 	.add("parse", () => {
// 		command.parse("a b -en -sn");
// 	})
// 	.on("cycle", event => {
// 		console.log(String(event.target));
// 	})
// 	.run();
