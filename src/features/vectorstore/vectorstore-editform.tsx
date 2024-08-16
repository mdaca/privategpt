import * as React from "react";
import { Dialog } from "@progress/kendo-react-dialogs";
import { Form, Field, FormElement } from "@progress/kendo-react-form";
import { Input, NumericTextBox } from "@progress/kendo-react-inputs";
import { DropDownList } from "@progress/kendo-react-dropdowns";
import { Error } from "@progress/kendo-react-labels";
import { Textarea } from "@/components/ui/textarea";
import { CheckboxItem } from "@radix-ui/react-dropdown-menu";
import { useSession } from "next-auth/react";
import { useRef } from "react";
const minValueValidator = (value) =>
  value >= 0 ? "" : "The value must be 0 or higher";
const NonNegativeNumericInput = (fieldRenderProps) => {
  const { validationMessage, visited, ...others } = fieldRenderProps;
  return (
    <div>
      <NumericTextBox {...others} />
      {visited && validationMessage && <Error>{validationMessage}</Error>}
    </div>
  );
};

const alphaRegex = new RegExp(/^[a-zA-Z0-9_-]*$/);
const alphaValidator = (value) =>
alphaRegex.test(value) ? "" : "Please enter only numbers and letters.";

const EditForm = (props) => {
    const { data: session } = useSession();
    const user: any = session?.user;

    const ddlGS: any = useRef();
    const ddl: any = useRef();
    const yesNoData = [{text: 'Yes', value: 1}, {text: 'No', value: 0}];
    const storeTypeData = [{text: 'Large - Ideal for lots of text on the same topic', value: 'Large'}, {text: 'Small Documents - Can handle documents on distinct topics', value: 'SmallDocs'}, {text: 'Graph - Extract a knowledge graph from text', value: 'Graph'}];
    let priv = 
    <div className="mb-3">
      <Field
        name={"isPrivate"}
        component={DropDownList}
        label={"Private ?"}
        ref={ddl}
        data={yesNoData}
        textField={"text"}
        dataItemKey={"value"}
      />
    </div>;

    if(user && user.isAdmin == false) {
        priv = <div></div>;
    }


  return (
    <Dialog title={`${ parseInt(props.item.id) < 0 ? 'Add New' : 'Edit'} ${props.item.collectionName}`} onClose={props.cancelEdit}>
      <Form
        onSubmit={props.onSubmit}
        initialValues={props.item}
        render={(formRenderProps) => (
          <FormElement
            style={{
              maxWidth: 650,
            }}
          >
          <span>Expected Store Name: (1) contains 3-63 characters, (2) starts and ends with an alphanumeric character, (3) otherwise contains only alphanumeric characters, underscores or hyphens (-), (4) contains no two consecutive periods (..) and (5) is not a valid IPv4 address
            </span>
            <fieldset className={"k-form-fieldset"}>
              <div className="mb-3">
                <Field
                  name={"collectionName"}
                  component={Input}
                  label={"Store Name"}
                  validator={alphaValidator}
                />
              </div>
              <div className="mb-3">
                <Field
                  name={"collectionDesc"}
                  component={Textarea}
                  label={"Store Description"}
                />
              </div>
              
              <div className="mb-3">
              <Field
                name={"storeType"}
                component={DropDownList}
                label={"Type of Store"}
                ref={ddlGS}
                data={storeTypeData}
                textField={"text"}
                dataItemKey={"value"}
              />
            </div>
              {priv}
            </fieldset>
            <div className="k-form-buttons">
              <button
                type={"submit"}
                className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary"
                disabled={!formRenderProps.allowSubmit}
              >
                {`${ parseInt(props.item.id) < 0 ? 'Create' : 'Update'}`}
              </button>
              <button
                type={"submit"}
                className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-base"
                onClick={props.cancelEdit}
              >
                Cancel
              </button>
            </div>
          </FormElement>
        )}
      />
    </Dialog>
  );
};
export default EditForm;