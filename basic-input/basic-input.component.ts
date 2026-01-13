import {
  Component,
  input,
  output,
  model,
  OnDestroy,
  viewChild,
  inject,
  TemplateRef,
  ViewContainerRef,
  computed,
  ElementRef,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ControlContainer, FormsModule, NgModelGroup } from "@angular/forms";
import { HlmInputImports } from "@spartan-ng/helm/input";
import { HlmLabelImports } from "@spartan-ng/helm/label";
import { Overlay, OverlayModule, OverlayRef } from "@angular/cdk/overlay";
import { PortalModule, TemplatePortal } from "@angular/cdk/portal";
import { BrnCommandImports } from "@spartan-ng/brain/command";
import { HlmCommandImports } from "@spartan-ng/helm/command";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucideInfo, lucideEye, lucideEyeOff } from "@ng-icons/lucide";
import { HlmTooltipImports } from "@spartan-ng/helm/tooltip";

@Component({
  selector: "app-basic-input",
  templateUrl: "./basic-input.component.html",
  imports: [
    CommonModule,
    FormsModule,
    HlmInputImports,
    HlmLabelImports,
    OverlayModule,
    PortalModule,
    BrnCommandImports,
    HlmCommandImports,
    NgIcon,
    HlmTooltipImports,
  ],
  providers: [
    provideIcons({
      lucideInfo,
      // Added
      lucideEye,
      lucideEyeOff,
    }),
  ],
  // Added
  viewProviders: [{ provide: ControlContainer, useExisting: NgModelGroup }],
})
export class BasicInputComponent<T> implements OnDestroy {
  public readonly id = `input-${Math.random().toString(36).substring(2, 15)}`;
  private readonly overlay = inject(Overlay);
  public readonly inputFieldRef = viewChild<ElementRef<HTMLInputElement>>("inputField");
  public readonly hintsDropdownRef = viewChild<TemplateRef<any>>("hintsDropdown");
  private readonly viewContainerRef = inject(ViewContainerRef);

  // Added
  public readonly name = input<string | undefined>(undefined);
  public readonly showPassword = signal<boolean>(false);

  public readonly value = model<T>(undefined);
  public readonly min = input<T | undefined>(undefined);
  public readonly max = input<T | undefined>(undefined);
  public readonly prefix = input<string | undefined>(undefined);
  public readonly suffix = input<string | undefined>(undefined);
  public readonly label = input<string | undefined>(undefined);
  public readonly placeholder = input<string | undefined>(undefined);
  public readonly tooltip = input<string | undefined>(undefined);
  public readonly disabled = input<boolean>(false);
  public readonly error = input<boolean>(false);
  public readonly type = input<
    "text" | "textarea" | "number" | "email" | "password" | "time" | "url"
  >("text");
  public readonly hints = input<T[]>([]);
  public readonly commit = output<T>();

  public readonly filteredHints = computed(() => {
    const lowerInputText = String(this.value()).toLowerCase();
    return this.hints().filter((h) => String(h).toLowerCase().includes(lowerInputText));
  });

  // Added
  protected readonly getInputType = computed(() => {
    if (this.type() === "password") {
      return this.showPassword() ? "text" : "password";
    }
    return this.type();
  });

  private overlayRef: OverlayRef | null = null;

  typeInput(inputStr: string): T | undefined {
    if (this.type() != "number") return <T>inputStr;
    const inputTyped = parseFloat(inputStr);
    return isNaN(inputTyped) ? undefined : <T>inputTyped;
  }

  onChange(inputStr: string) {
    const orgValue = this.typeInput(inputStr);
    let value = orgValue;
    if (this.min() !== undefined && value < this.min()) {
      value = this.min();
    }
    if (this.max() !== undefined && value > this.max()) {
      value = this.max();
    }
    if (value != orgValue) {
      this.inputFieldRef().nativeElement.value =
        value == undefined ? "" : String(value);
    }
    if (this.value() !== value) this.value.set(value);
    this.commit.emit(value);
  }

  openHints(anchor: HTMLElement) {
    // if (this.overlayRef) return;
    if (this.overlayRef || this.hints().length === 0) return;

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(anchor)
      .withFlexibleDimensions(true)
      .withPush(true)
      .withGrowAfterOpen(true)
      .withViewportMargin(8)
      .withPositions([
        {
          originX: "start",
          originY: "bottom",
          overlayX: "start",
          overlayY: "top",
        },
        {
          originX: "start",
          originY: "top",
          overlayX: "start",
          overlayY: "bottom",
        },
      ]);

    const overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: "cdk-overlay-transparent-backdrop",
    });
    overlayRef.attach(
      new TemplatePortal(this.hintsDropdownRef(), this.viewContainerRef),
    );
    overlayRef.backdropClick().subscribe(() => this.closeHints());
    overlayRef.keydownEvents().subscribe((event) => {
      if (event.key === "Escape") this.closeHints();
    });
    this.overlayRef = overlayRef;
  }

  closeHints() {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  ngOnDestroy(): void {
    this.closeHints();
  }
}
