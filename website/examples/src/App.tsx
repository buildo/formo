import { MyForm as QuickStart } from "./quick-start/MyForm";
import { MyForm as RecommendedPatterns1 } from "./recommended-patterns/avoid-using-native-form-elements-directly/MyForm";
import { MyForm as RecommendedPatterns2 } from "./recommended-patterns/define-a-shared-type-for-field-issues/MyForm";
import { MyForm as ValidatingFields1 } from "./validating-fields/simple-validation/MyForm";
import { MyForm as ValidatingFields2 } from "./validating-fields/multiple-validations-on-a-field/MyForm";
import { MyForm as ValidatingFields3 } from "./validating-fields/transforming-values/MyForm";
import { MyForm as ValidatingFields4 } from "./validating-fields/defining-custom-validations/MyForm";
import { MyForm as SubmittingForm } from "./submitting-a-form/MyForm";
import { MyForm as Subform } from "./subform/MyForm";

function App() {
  return (
    <div>
      <h1>Quick Start</h1>
      <QuickStart />
      <h1>Recommended Patterns: avoid-using-native-form-elements-directly</h1>
      <RecommendedPatterns1 />
      <h1>Recommended: define-a-shared-type-for-field-issues</h1>
      <RecommendedPatterns2 />
      <h1>Validating Fields simple-validation</h1>
      <ValidatingFields1 />
      <h1>Validating Fields multiple-validations-on-a-field</h1>
      <ValidatingFields2 />
      <h1>Validating Fields transforming-values</h1>
      <ValidatingFields3 />
      <h1>Validating Fields defining-custom-validations</h1>
      <ValidatingFields4 />
      <h1>SubmittingForm</h1>
      <SubmittingForm />
      <h1>Subform</h1>
      <Subform />
    </div>
  );
}

export default App;
