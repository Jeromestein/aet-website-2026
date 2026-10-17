import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { EVALUATOR_PROFILES } from "./about-aet-page";
import { EditableInput, EditableImage } from "../ui/editable-elements";
import { SampleData, UpdateDataField } from "../types";

const EVALUATOR_SIGNATURES: Record<string, string> = {
  "Luguan Yan": "/luguan-yan-signature.png",
  "Hongjian Chen": "/hongjian-chen-signature.png",
  "Tong Liu": "/tong-liu-signature.png",
  "Peiheng Li": "/peiheng-li-signature.png",
  "Yue Qi": "/yue-qi-signature.png",
  "Jianjun Zhao": "/jianjun-zhao-signature.png",
  "Beatriz Y. Pineda Gayon": "/beatriz-signature.png",
  "Zhihua Zhao": "/zhihua-zhao-signature.png",
  "Yang Song": "/yang-song-signature.png",
};

type SignaturesProps = {
  data: SampleData;
  updateDataField: UpdateDataField;
  readOnly?: boolean;
};

export const Signatures = ({
  data,
  updateDataField,
  readOnly = false,
}: SignaturesProps) => {
  const handleEvaluatorSelect = (name: string) => {
    updateDataField("evaluatorName", name);
    updateDataField("evaluatorSignature", EVALUATOR_SIGNATURES[name] || "");
  };

  return (
    <div className="grid grid-cols-2 gap-8 mt-2">
      <div>
        <div className="mb-1 pb-1">
          <EditableImage
            src={data.evaluatorSignature}
            alt="Evaluator Signature"
            width={128}
            height={48}
            onChange={(value) => updateDataField("evaluatorSignature", value)}
            readOnly={readOnly}
            className="h-12 w-auto mb-1"
          />
        </div>
        <div className="font-bold text-blue-900 text-sm">
          <EditableInput
            ariaLabel="Evaluator name"
            value={data.evaluatorName}
            onChange={(value) => updateDataField("evaluatorName", value)}
            className="font-bold text-center"
            readOnly={readOnly}
          />
        </div>
        <div className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
          Evaluator
          {!readOnly && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="text-gray-400 hover:text-blue-600 outline-none transition-colors no-print"
                  title="Select Evaluator"
                >
                  <Info className="h-3 w-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2">
                <div className="text-xs font-semibold mb-2 px-2 text-gray-900 border-b pb-1">
                  Select Evaluator
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-0.5">
                  {EVALUATOR_PROFILES.filter((p) => !p.isSenior).map((p) => (
                    <button
                      type="button"
                      key={p.name}
                      className="text-xs px-2 py-1.5 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded cursor-pointer transition-colors"
                      onClick={() => handleEvaluatorSelect(p.name)}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
      <div>
        <div className="mb-1 pb-1">
          <EditableImage
            src={data.seniorEvaluatorSignature}
            alt="Senior Evaluator Signature"
            width={128}
            height={48}
            onChange={(value) =>
              updateDataField("seniorEvaluatorSignature", value)
            }
            readOnly={readOnly}
            className="h-12 w-auto mb-1"
          />
        </div>
        <div className="font-bold text-blue-900 text-sm">
          <EditableInput
            ariaLabel="Senior evaluator name"
            value={data.seniorEvaluatorName}
            onChange={(value) => updateDataField("seniorEvaluatorName", value)}
            className="font-bold text-center"
            readOnly={readOnly}
          />
        </div>
        <div className="text-xs text-gray-500 text-center">
          Senior Evaluator
        </div>
      </div>
    </div>
  );
};
