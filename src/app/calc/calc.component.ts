import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Subscription, combineLatest, Observable } from 'rxjs';
import { startWith, distinctUntilChanged, map } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material';
import { PanelComponent } from '../panel/panel.component';
import { CenteredSnackbarComponent } from '../centered-snack-bar/centered-snack-bar.component';

declare var process: (o: any) => string;
declare var wasmReady: Promise<any>;

@Component({
	selector: 'app-calc',
	templateUrl: './calc.component.html',
	styleUrls: ['./calc.component.css'],
})
export class CalcComponent implements OnInit, OnDestroy {
	@ViewChild("lvlsPanel", { static: true })
	public lvlsPanel: PanelComponent;
	@ViewChild("bxpPanel", { static: true })
	public bxpPanel: PanelComponent;
	@ViewChild("itemsPanel", { static: true })
	public itemsPanel: PanelComponent;

	public showBlackboard = false;

	public subscriptions: Subscription[] = [];

	public progressValues = {
		1: "I haven't played BA",
		2: "I killed Queen after the rework",
		3: "I got up to wave 6 or 9 in HM",
		4: "I've killed King",
	};

	public form: FormGroup = new FormGroup({
		rsn: new FormControl('', Validators.required),
		charges: new FormControl(0),
		progress: new FormControl(1, Validators.required),
		ironman: new FormControl(false),

		comp: new FormControl(false),

		lvls: new FormGroup({
			needAttLvl: new FormControl(1, Validators.compose([Validators.min(1), Validators.max(5)])),
			needDefLvl: new FormControl(1, Validators.compose([Validators.min(1), Validators.max(5)])),
			needColLvl: new FormControl(1, Validators.compose([Validators.min(1), Validators.max(5)])),
			needHealLvl: new FormControl(1, Validators.compose([Validators.min(1), Validators.max(5)])),

			needsKing: new FormControl(false),
		}),

		bxp: new FormGroup({
			agility: new FormControl(0, Validators.compose([Validators.min(0), Validators.max(150000000)])),
			firemaking: new FormControl(0, Validators.compose([Validators.min(0), Validators.max(150000000)])),
			mining: new FormControl(0, Validators.compose([Validators.min(0), Validators.max(150000000)])),
		}),

		items: new FormGroup({
			hats: new FormControl(0, Validators.compose([Validators.min(0), Validators.max(4)])),
			boots: new FormControl(0, Validators.compose([Validators.min(0), Validators.max(1)])),
			gloves: new FormControl(0, Validators.compose([Validators.min(0), Validators.max(1)])),
			torso: new FormControl(0, Validators.compose([Validators.min(0), Validators.max(1)])),
			skirt: new FormControl(0, Validators.compose([Validators.min(0), Validators.max(1)])),
			armourPatches: new FormControl(0, Validators.compose([Validators.min(0), Validators.max(4)])),
			attackerInsignia: new FormControl(0, Validators.compose([Validators.min(0), Validators.max(1)])),
			defenderInsignia: new FormControl(0, Validators.compose([Validators.min(0), Validators.max(1)])),
			healerInsignia: new FormControl(0, Validators.compose([Validators.min(0), Validators.max(1)])),
			collectorInsignia: new FormControl(0, Validators.compose([Validators.min(0), Validators.max(1)])),
		}),

		has: new FormGroup({
			attackerPts: new FormControl(0, Validators.compose([Validators.min(0), Validators.max(5000)])),
			attackerLvl: new FormControl(1, Validators.compose([Validators.min(1), Validators.max(5)])),
			defenderPts: new FormControl(0, Validators.compose([Validators.min(0), Validators.max(5000)])),
			defenderLvl: new FormControl(1, Validators.compose([Validators.min(1), Validators.max(5)])),
			collectorPts: new FormControl(0, Validators.compose([Validators.min(0), Validators.max(5000)])),
			collectorLvl: new FormControl(1, Validators.compose([Validators.min(1), Validators.max(5)])),
			healerPts: new FormControl(0, Validators.compose([Validators.min(0), Validators.max(5000)])),
			healerLvl: new FormControl(1, Validators.compose([Validators.min(1), Validators.max(5)])),

			kings: new FormControl(0, Validators.compose([Validators.min(0), Validators.max(50)])),
		}),
	});

	public request$ = this.form.valueChanges.pipe(
		distinctUntilChanged(),
		map(form => {
			let wantsAttackerLvl = form.lvls.needAttLvl || 1;
			let wantsDefenderLvl = form.lvls.needDefLvl || 1;
			let wantsCollectorLvl = form.lvls.needColLvl || 1;
			let wantsHealerLvl = form.lvls.needHealLvl || 1;

			let hasAttackerLvl = form.has.attackerLvl || 1;
			let hasDefenderLvl = form.has.defenderLvl || 1;
			let hasCollectorLvl = form.has.collectorLvl || 1;
			let hasHealerLvl = form.has.healerLvl || 1;

			let wantsAttackerPts = 0;
			let wantsDefenderPts = 0;
			let wantsCollectorPts = 0;
			let wantsHealerPts = 0;

			let hasAttackerPts = form.has.attackerPts || 0;
			let hasDefenderPts = form.has.defenderPts || 0;
			let hasCollectorPts = form.has.collectorPts || 0;
			let hasHealerPts = form.has.healerPts || 0;

			// keep wants lvl in sync with has lvl
			wantsAttackerLvl = Math.max(wantsAttackerLvl, hasAttackerLvl);
			wantsDefenderLvl = Math.max(wantsDefenderLvl, hasDefenderLvl);
			wantsCollectorLvl = Math.max(wantsCollectorLvl, hasCollectorLvl);
			wantsHealerLvl = Math.max(wantsHealerLvl, hasHealerLvl);

			// keep wants lvl and pts in sync with insignias
			if (form.items.attackerInsignia > 0) {
				wantsAttackerLvl = 5;
				wantsAttackerPts += 500;
			}
			if (form.items.defenderInsignia > 0) {
				wantsDefenderLvl = 5;
				wantsDefenderPts += 500;
			}
			if (form.items.collectorInsignia > 0) {
				wantsCollectorLvl = 5;
				wantsCollectorPts += 500;
			}
			if (form.items.healerInsignia > 0) {
				wantsHealerLvl = 5;
				wantsHealerPts += 500;
			}

			let needsAttackerPts = Math.max(wantsAttackerPts - hasAttackerPts + this.lvlDiff(hasAttackerLvl, wantsAttackerLvl), 0);
			let needsDefenderPts = Math.max(wantsDefenderPts - hasDefenderPts + this.lvlDiff(hasDefenderLvl, wantsDefenderLvl), 0);
			let needsCollectorPts = Math.max(wantsCollectorPts - hasCollectorPts + this.lvlDiff(hasCollectorLvl, wantsCollectorLvl), 0);
			let needsHealerPts = Math.max(wantsHealerPts - hasHealerPts + this.lvlDiff(hasHealerLvl, wantsHealerLvl), 0);

			let request = {
				rsn: form.rsn || "",
				ironman: form.ironman || false,
				progress: form.progress || 0,
				charges: form.charges || 0,
				pts: {
					attacker: needsAttackerPts,
					defender: needsDefenderPts,
					collector: needsCollectorPts,
					healer: needsHealerPts,
				},
				bxp: {
					agility: form.bxp.agility || 0,
					firemaking: form.bxp.firemaking || 0,
					mining: form.bxp.mining || 0,
				},
				queen: 0,
				king: 0,
				hm10tickets: form.tickets || 0,
			};

			// armour
			if (form.items.hats > 0) {
				request.pts.attacker += 275 * form.items.hats;
				request.pts.defender += 275 * form.items.hats;
				request.pts.collector += 275 * form.items.hats;
				request.pts.healer += 275 * form.items.hats;
				request.queen += form.items.hats;
			}
			if (form.items.boots > 0) {
				request.pts.attacker += 100 * form.items.boots;
				request.pts.defender += 100 * form.items.boots;
				request.pts.collector += 100 * form.items.boots;
				request.pts.healer += 100 * form.items.boots;
			}
			if (form.items.gloves > 0) {
				request.pts.attacker += 150 * form.items.gloves;
				request.pts.defender += 150 * form.items.gloves;
				request.pts.collector += 150 * form.items.gloves;
				request.pts.healer += 150 * form.items.gloves;
			}
			if (form.items.torso > 0) {
				request.pts.attacker += 375 * form.items.torso;
				request.pts.defender += 375 * form.items.torso;
				request.pts.collector += 375 * form.items.torso;
				request.pts.healer += 375 * form.items.torso;
				request.queen += form.items.torso;
			}
			if (form.items.skirt > 0) {
				request.pts.attacker += 375 * form.items.skirt;
				request.pts.defender += 375 * form.items.skirt;
				request.pts.collector += 375 * form.items.skirt;
				request.pts.healer += 375 * form.items.skirt;
				request.queen += form.items.skirt;
			}
			if (form.items.armourPatches > 0) {
				request.pts.collector += 100 * form.items.armourPatches;
			}

			// insignias
			if (form.items.attackerInsignia > 0) {
				request.king += 5;
			}
			if (form.items.defenderInsignia > 0) {
				request.king += 5;
			}
			if (form.items.collectorInsignia > 0) {
				request.king += 5;
			}
			if (form.items.healerInsignia > 0) {
				request.king += 5;
			}

			// if leech needs comp, add it
			if (form.comp && request.queen <= 0) {
				request.queen = 1;
			}

			// if leech needs king for trim, add it
			if (form.lvls.needsKing && request.king <= 0) {
				request.king = 1;
			}

			request.king -= form.has.kings;
			request.king = Math.max(request.king, 0);

			return request;
		}),
		startWith({
			rsn: "",
			ironman: false,
			progress: 0,
			charges: 0,
			pts: {
				attacker: 0,
				defender: 0,
				collector: 0,
				healer: 0,
			},
			bxp: {
				agility: 0,
				firemaking: 0,
				mining: 0,
			},
			queen: 0,
			king: 0,
			hm10tickets: 0,
		})
	);

	public result$ = combineLatest(
		this.request$,
		wasmReady,
	).pipe(
		map(([r, _]) => JSON.parse(process(r)))
	);

	public total$ = this.result$.pipe(
		map(r => {
			if (!r || !r.order || !r.order.breakdown) {
				return undefined;
			}

			return r.order.breakdown.reduce((acc, v) => {
				acc.price += (v.priceDur.price || 0) * v.count;
				acc.dur += (v.priceDur.dur || 0) * v.count;
				return acc;
			}, {price: 0, dur: 0})
		})
	)

	private blackboard = {
		attacker: [
			{ next: '+200 bonus damage', pts: '200' },
			{ next: '+300 bonus damage', pts: '300' },
			{ next: '+400 bonus damage', pts: '400' },
			{ next: '+500 bonus damage', pts: '500' },
			{ next: '- Mastered -', pts: '---' },
		],
		defender: [
			{ next: 'Bonus logs 1', pts: '200' },
			{ next: 'Bonus logs 2', pts: '300' },
			{ next: 'Bonus logs 3', pts: '400' },
			{ next: 'Bonus logs 4', pts: '500' },
			{ next: '- Mastered -', pts: '---' },
		],
		collector: [
			{ next: 'Egg convert success 70%', pts: '200' },
			{ next: 'Egg convert success 80%', pts: '300' },
			{ next: 'Egg convert success 90%', pts: '400' },
			{ next: 'Egg convert success 100%', pts: '500' },
			{ next: '- Mastered -', pts: '---' },
		],
		healer: [
			{ next: 'Heal 25% life points', pts: '200' },
			{ next: 'Heal 40% life points', pts: '300' },
			{ next: 'Heal 45% life points', pts: '400' },
			{ next: 'Heal 50% life points', pts: '500' },
			{ next: '- Mastered -', pts: '---' },
		],
	}

	constructor(private snackBar: MatSnackBar) { }

	ngOnInit() {
		// show ticket control if ironman and hm10
		this.addSubscription(
			combineLatest(
				this.form.get('ironman').valueChanges.pipe(startWith(false)),
				this.form.get('progress').valueChanges.pipe(startWith(1)),
			).subscribe({
				next: ([ironman, progress]) => {
					if (!ironman || progress !== 4) {
						this.form.removeControl("tickets");
						return;
					}

					if (!this.form.contains("tickets")) {
						this.form.addControl("tickets", this.makeTicketControl());
					}
				}
			})
		);

		// toggle bxp section off for ironman
		this.addSubscription(
			this.form.get('ironman').valueChanges.pipe(distinctUntilChanged()).subscribe({
				next: (v) => {
					if (v) {
						this.form.get("bxp").setValue({
							agility: 0,
							firemaking: 0,
							mining: 0,
						});

						this.form.get("items").patchValue({
							attackerInsignia: 0,
							defenderInsignia: 0,
							healerInsignia: 0,
							collectorInsignia: 0,
						});
						this.bxpPanel.disabled = true;
						this.bxpPanel.expanded = false;
					} else {
						this.bxpPanel.disabled = false;
					}
				}
			})
		);

		// disable lvls section if it's filled in
		this.addSubscription(this.form.get('lvls').valueChanges.subscribe({
			next: (v) => {
				this.lvlsPanel.disabled = !this.form.get('lvls').valid || v.needsKing || this.anyPropsBiggerThan(v, 1);
			}
		}));

		// disable bxp section if it's filled in
		this.addSubscription(this.form.get('bxp').valueChanges.subscribe({
			next: (v) => {
				this.bxpPanel.disabled = !this.form.get('bxp').valid || this.anyPropsBiggerThan(v, 0);
			}
		}));

		// disable items section if it's filled in
		this.addSubscription(this.form.get('items').valueChanges.subscribe({
			next: (v) => {
				this.itemsPanel.disabled = !this.form.get('items').valid || this.anyPropsBiggerThan(v, 0);
			}
		}));
	}

	ngOnDestroy() {
		this.subscriptions.forEach(s => s.unsubscribe());
	}

	public onExpand(section: string) {
		switch (section) {
			case "hmUnlock":
				this.form.get("comp").setValue(true);
				this.snackBar.openFromComponent(CenteredSnackbarComponent, { duration: 3000, data: "Added Hardmode Unlock to your request" });
				break;
		}
	}

	public onCollapse(section: string) {
		switch (section) {
			case "hmUnlock":
				this.form.get("comp").setValue(false);
				this.snackBar.openFromComponent(CenteredSnackbarComponent, { duration: 3000, data: "Removed Hardmode Unlock from your request" });
				break;
			case "lvls":
				this.snackBar.openFromComponent(CenteredSnackbarComponent, { duration: 3000, data: "Removed Pts & Levels from your request" });
				break;
			case "bxp":
				this.snackBar.openFromComponent(CenteredSnackbarComponent, { duration: 3000, data: "Removed Bxp Leech from your request" });
				break;
			case "items":
				this.snackBar.openFromComponent(CenteredSnackbarComponent, { duration: 3000, data: "Removed Item Leech from your request" });
				break;
		}
	}

	public showCurrentPts(): boolean {
		let val = this.form.value;

		if (val.lvls.needAttLvl > 1) return true;
		if (val.lvls.needDefLvl > 1) return true;
		if (val.lvls.needColLvl > 1) return true;
		if (val.lvls.needHealLvl > 1) return true;
		if (val.items.hats > 0) return true;
		if (val.items.boots > 0) return true;
		if (val.items.gloves > 0) return true;
		if (val.items.torso > 0) return true;
		if (val.items.skirt > 0) return true;
		if (val.items.armourPatches > 0) return true;
		if (val.items.attackerInsignia > 0) return true;
		if (val.items.defenderInsignia > 0) return true;
		if (val.items.healerInsignia > 0) return true;
		if (val.items.collectorInsignia > 0) return true;

		return false;
	}

	public rewardNextLvl(role: string): string {
		return this.blackboard[role][(this.form.get("has").get(role + "Lvl").value || 1) - 1].next;
	}

	public ptsNextLvl(role: string): number {
		return this.blackboard[role][(this.form.get("has").get(role + "Lvl").value || 1) - 1].pts;
	}

	public hasPts(item): boolean {
		if (!item.ptsGained) {
			return false;
		}

		return item.ptsGained.attacker > 0 ||
			item.ptsGained.defender > 0 ||
			item.ptsGained.collector > 0 ||
			item.ptsGained.healer > 0;
	}

	public hasBxp(item): boolean {
		if (!item.bxpGained) {
			return false;
		}

		return item.bxpGained.agility > 0 ||
			item.bxpGained.firemaking > 0 ||
			item.bxpGained.mining > 0;
	}

	private makeTicketControl(): FormControl {
		return new FormControl(undefined, Validators.compose([Validators.min(0), Validators.max(500)]));
	}

	private addSubscription(s: Subscription) {
		this.subscriptions.push(s);
	}

	private anyPropsBiggerThan(o, n: number) {
		return Object.keys(o).some((v) => o[v] > n);
	}

	private lvlDiff(hasLvl: number, wantsLvl: number): number {
		const pts = [0, 200, 500, 900, 1400];
		return Math.max(pts[wantsLvl - 1] - pts[hasLvl - 1], 0);
	}
}

