import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'time',
	pure: true,
})
export class TimePipe implements PipeTransform {
	transform(value: number, ...args: any[]): string {
		if (value <= 0 || typeof value != "number") {
			return null;
		}

		value /= 1000000000;

		let h = Math.floor(value / 3600);
		let m = Math.floor(value % 3600 / 60);
		let s = Math.floor(value % 3600 % 60);

		return `${h.toString(10).padStart(2, '0')}:${m.toString(10).padStart(2, '0')}:${s.toString(10).padStart(2, '0')}`;
	}
}
