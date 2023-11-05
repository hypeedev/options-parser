export default function gestaltSimilarity(s1, s2) {
	let length = s1.length + s2.length;
	let matches = 0;

	let queue = [ s1, s2 ];
	while (queue.length !== 0) {
		let s2 = queue.pop();
		let s1 = queue.pop();

		let s1MaxStartIndex = 0;
		let s2MaxStartIndex = 0;
		let maxCommonLength = 0;

		for (let i = 0; i < s1.length - maxCommonLength; i++) {
			let s1StartIndex = i;
			let ch = s1[s1StartIndex];

			let s2StartIndex = s2.indexOf(ch);
			if (s2StartIndex === -1) continue;

			let s1Char, s2Char;
			while (true) {
				s1Char = s1[s1StartIndex];
				s2Char = s2[s2StartIndex];

				if (s1Char !== s2Char || s1Char === undefined || s2Char === undefined) break;

				s1StartIndex += 1;
				s2StartIndex += 1;
			}

			let length = s1StartIndex - i;

			if (length > maxCommonLength) {
				s1MaxStartIndex = s1StartIndex - length;
				s2MaxStartIndex = s2StartIndex - length;
				maxCommonLength = length;
			}
		}

		if (maxCommonLength === 0) continue;

		matches += maxCommonLength;

		queue.push(s1.substring(0, s1MaxStartIndex), s2.substring(0, s2MaxStartIndex));
		queue.push(s1.substring(s1MaxStartIndex + maxCommonLength), s2.substring(s2MaxStartIndex + maxCommonLength));
	}

	return 2 * matches / length;
}
