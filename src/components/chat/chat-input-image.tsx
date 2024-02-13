import { Loader, Send } from "lucide-react";
import { FC, FormEvent, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { ComboBox, ComboBoxChangeEvent } from "@progress/kendo-react-dropdowns";
import { relative } from "path";

interface Props {
  value: string;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  handleInputChange: (e: any) => void;
  handleSizeChange: (e: any) => void;
  handleStyleChange: (e: any) => void;
  handleQualityChange: (e: any) => void;
  isLoading: boolean;
}

const ChatInputImage: FC<Props> = (props) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [rows, setRows] = useState(1);
  const maxRows = 6;
  const [keysPressed, setKeysPressed] = useState(new Set());
  
  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    setKeysPressed(keysPressed.add(event.key));

    if (keysPressed.has("Enter") && keysPressed.has("Shift")) {
      setRowsToMax(rows + 1);
    }

    if (
      keysPressed.has("Enter") &&
      !keysPressed.has("Shift") &&
      buttonRef.current
    ) {
      buttonRef.current.click();
      event.preventDefault();
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    props.handleSubmit(e);
    setRows(1);
  };

  const onKeyUp = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    keysPressed.delete(event.key);
    setKeysPressed(keysPressed);
  };

  const onChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRowsToMax(event.target.value.split("\n").length - 1);
    props.handleInputChange(event);
  };
  
  const onComboChange = (eve: ComboBoxChangeEvent) => {
    props.handleSizeChange(eve.target.value);
    //setBody((e) => ({ ...e, collectionName: eve.target.value }));
  };
  
  const onComboQualityChange = (eve: ComboBoxChangeEvent) => {
    props.handleQualityChange(eve.target.value);
    //setBody((e) => ({ ...e, collectionName: eve.target.value }));
  };
  
  const onComboStyleChange = (eve: ComboBoxChangeEvent) => {
    props.handleStyleChange(eve.target.value);
    //setBody((e) => ({ ...e, collectionName: eve.target.value }));
  };


  const setRowsToMax = (rows: number) => {
    if (rows < maxRows) {
      setRows(rows + 1);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="absolute bottom-0 w-full flex items-center"
    >
      <div className="container mx-auto max-w-10xl relative py-2 flex gap-2 items-end">
    <div style={{marginRight: '2px'}} className="justify-right p-1  py-4" >
    <ComboBox style={{width: "180px"}}
                data={["1024x1024", "1792x1024", "1024x1792"]}
                id="sizes"
                allowCustom={false}
                placeholder="Select a Size"
                onChange={onComboChange}
                defaultValue={"1024x1024"}
              />
    </div>
    <div style={{position:"relative"}}  className="container mx-auto max-w-8xl relative py-2 flex gap-2 items-end" >
        <Textarea
          rows={rows}
          placeholder="Generate an Image"
          className="min-h-fit bg-background shadow-sm resize-none py-4"
          value={props.value}
          onKeyUp={onKeyUp}
          onKeyDown={onKeyDown}
          onChange={onChange}
        ></Textarea>
        <div className="absolute right-0 bottom-0 px-8 flex items-end h-full mr-2 mb-4">
          <Button
            size="icon"
            type="submit"
            variant={"ghost"}
            ref={buttonRef}
            disabled={props.isLoading}
          >
            {props.isLoading ? (
              <Loader className="animate-spin" size={16} />
            ) : (
              <Send size={16} />
            )}
          </Button>
        </div>
        </div>
    <div style={{marginRight: '2px'}} className="justify-right p-1   py-4" >
    <ComboBox style={{width: "180px"}}
                data={["hd", "standard"]}
                id="quality"
                allowCustom={false}
                placeholder="Select a Quality"
                onChange={onComboQualityChange}
                defaultValue={"hd"}
              />
    </div>
    <div style={{marginRight: '2px'}} className="justify-right p-1  py-4" >
    <ComboBox style={{width: "180px"}}
                data={["vivid", "natural"]}
                id="style"
                allowCustom={false}
                placeholder="Select a Style"
                onChange={onComboStyleChange}
                defaultValue={"vivid"}
              />
    </div>
      </div>
    </form>
  );
};

export default ChatInputImage;
