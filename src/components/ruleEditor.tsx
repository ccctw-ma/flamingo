import { Rule, TYPE } from "../utils/types";
import CompactEditor from "./compactEditor";
import { useGlobalState } from "../utils/hooks";

export default function RuleEditor() {
  const { selected, setEdit, setEditType, saveEdit } = useGlobalState();

  const handleRuleChange = async (rule: Rule) => {
    setEdit(rule);
    setEditType(TYPE.Rule);
    await saveEdit(rule);
  };

  if (!selected) {
    return null;
  }

  return <CompactEditor rule={selected} onChange={handleRuleChange} />;
}
