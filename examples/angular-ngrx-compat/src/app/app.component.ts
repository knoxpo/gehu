import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, effect, inject, type OnInit } from "@angular/core";
import { CounterStore } from "./counter.store";
import { UsersStore } from "./users.store";

@Component({
	selector: "app-root",
	standalone: true,
	imports: [CommonModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<main style="font-family: system-ui; max-width: 32rem; margin: 2rem auto">
			<h1>@gehu-js/angular/ngrx-compat Example</h1>

			<section style="border: 1px solid #ddd; padding: 1rem; margin-bottom: 2rem; border-radius: 8px">
				<h2>Counter Store</h2>
				<p style="font-size: 2rem; margin: 0.5rem 0; font-weight: bold">{{ counter.count() }}</p>
				<p style="color: #666; margin: 0">doubled = {{ counter.doubled() }}</p>
				<p style="color: #999; font-size: 0.9rem">{{ counter.message() }}</p>
				<div style="display: flex; gap: 0.5rem; margin-top: 1rem">
					<button (click)="counter.increment()">Increment</button>
					<button (click)="counter.decrement()">Decrement</button>
					<button (click)="counter.reset()">Reset</button>
				</div>
			</section>

			<section style="border: 1px solid #ddd; padding: 1rem; margin-bottom: 2rem; border-radius: 8px">
				<h2>Users Store (Async)</h2>
				<div style="margin-bottom: 1rem">
					<button (click)="users.fetchUsers()" [disabled]="users.loading()">
						{{ users.loading() ? "Loading..." : "Fetch Users" }}
					</button>
				</div>

				@if (users.hasError()) {
					<div style="background: #fee; padding: 0.5rem; border-radius: 4px; margin-bottom: 1rem">
						<p style="margin: 0; color: #c33">Error: {{ users.error() }}</p>
						<button (click)="users.clearError()" style="margin-top: 0.5rem; font-size: 0.85rem">
							Dismiss
						</button>
					</div>
				}

				@if (users.isEmpty()) {
					<p style="color: #999; margin: 0">No users loaded. Click "Fetch Users" to load.</p>
				}

				@if (users.users().length > 0) {
					<div style="margin-top: 1rem">
						<p style="margin: 0 0 0.5rem 0; color: #666">User Count: {{ users.userCount() }}</p>
						<ul style="list-style: none; padding: 0; margin: 0">
							@for (user of users.users(); track user.id) {
								<li style="padding: 0.5rem; border-bottom: 1px solid #eee">
									<strong>{{ user.name }}</strong>
									<br />
									<small style="color: #999">{{ user.email }}</small>
								</li>
							}
						</ul>
					</div>
				}
			</section>
		</main>
	`,
	styles: [
		`
			:host {
				display: block;
			}
			button {
				padding: 0.5rem 1rem;
				cursor: pointer;
				border: 1px solid #ccc;
				border-radius: 4px;
				background: white;
				font-size: 1rem;
			}
			button:hover:not(:disabled) {
				background: #f0f0f0;
			}
			button:disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}
		`,
	],
})
export class AppComponent implements OnInit {
	readonly counter = inject(CounterStore);
	readonly users = inject(UsersStore);

	// effect() must be created in an injection context (field initializer),
	// not inside ngOnInit (a lifecycle hook is not an injection context → NG0203).
	private readonly persistCount = effect(() => {
		localStorage.setItem("counter-count", this.counter.count().toString());
	});

	ngOnInit() {
		this.counter.loadFromStorage();
	}
}
