import { ChangeDetectionStrategy, Component, inject, input } from "@angular/core";
import { ControlContainer, FormsModule, NgForm } from "@angular/forms";

import { LanguageService } from "../../../../../services/language.service";
import { CommonModule } from "@angular/common";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucideCheck, lucideEye, lucideEyeOff, lucideX } from "@ng-icons/lucide";
import { TranslationKey } from "../../../../../translations";
import { BasicInputComponent } from "../../../../../shared/components/ui/basic-input/basic-input.component";
import { PasswordValidatorDirective } from "./password-validator/password-validator.directive";

@Component({
  selector: "app-password-form",
  templateUrl: "./password-form.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NgIcon,
    BasicInputComponent,
    FormsModule,
    PasswordValidatorDirective,
  ],
  providers: [provideIcons({ lucideCheck, lucideX, lucideEye, lucideEyeOff })],

  // Added
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],

})
export class PasswordFormComponent {
  public readonly translate = inject(LanguageService).translator;

  public readonly disabled = input<boolean>(false);
  public readonly oldPasswordRequired = input<boolean>(false);

  // Added
  protected validatorChecks: [string, TranslationKey][] = [
    ["mustBeLongerThan12", "passwordReset.form.requirements.minimumLength"],
    ["mustContainLowercase", "passwordReset.form.requirements.lowercase"],
    ["mustContainUppercase", "passwordReset.form.requirements.uppercase"],
    ["mustContainDigit", "passwordReset.form.requirements.digit"],
    ["mustContainSpecialCharacter", "passwordReset.form.requirements.specialCharacter"],
    ["cannotContainWhitespace", "passwordReset.form.requirements.noWhitespace"],
    ["passwordsMustMatch", "passwordReset.form.requirements.passwordsMustMatch"],
  ];

  // public readonly valueChange = output<string | null>();
  // public readonly password = signal<string>("");
  // public readonly hidePassword = signal<boolean>(true);
  // public readonly repeatedPassword = signal<string>("");
  // public readonly hideRepeatedPassword = signal<boolean>(true);
  // public readonly passwordChecks = computed(() => {
  //   const password = this.password();
  //   const repeatedPassword = this.repeatedPassword();
  //   const conditions: { label: TranslationKey; value: boolean }[] = [
  //     {
  //       label: "passwordReset.form.requirements.minimumLength",
  //       value: password.length >= 12,
  //     },
  //     {
  //       label: "passwordReset.form.requirements.lowercase",
  //       value: /[a-z]/.test(password),
  //     },
  //     {
  //       label: "passwordReset.form.requirements.uppercase",
  //       value: /[A-Z]/.test(password),
  //     },
  //     {
  //       label: "passwordReset.form.requirements.digit",
  //       value: /\d/.test(password),
  //     },
  //     {
  //       label: "passwordReset.form.requirements.specialCharacter",
  //       value: /[^a-zA-Z\d]/.test(password),
  //     },
  //     {
  //       label: "passwordReset.form.requirements.noWhitespace",
  //       value: !/\s/.test(password),
  //     },
  //     {
  //       label: "passwordReset.form.requirements.passwordsMustMatch",
  //       value: password == repeatedPassword,
  //     },
  //   ];
  //   const isValid = conditions.every((c) => c.value);
  //   return { isValid, conditions };
  // });

  // constructor() {
  //   let lastValue: string | null = null;
  //   effect(() => {
  //     const newValue = this.passwordChecks().isValid ? this.password() : null;
  //     if (lastValue == newValue) return;
  //     lastValue = newValue;
  //     this.valueChange.emit(newValue);
  //   });
  // }
}
