import { Switch } from "@/components/ui/switch";

export function AllianceRPToggles({
  title,
  coral,
  auto,
  barge,
  onCoralChange,
  onAutoChange,
  onBargeChange,
  className,
}: {
  title: string;
  coral: boolean;
  auto: boolean;
  barge: boolean;
  onCoralChange: (checked: boolean) => void;
  onAutoChange: (checked: boolean) => void;
  onBargeChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <div className={`${className ?? ""} border rounded-md p-4`}> 
      <div className="font-semibold mb-3 text-lg">{title}</div>
      <label className="flex items-center justify-between py-2 text-lg">
        <span>Coral RP</span>
        <Switch checked={coral} onCheckedChange={onCoralChange} />
      </label>
      <label className="flex items-center justify-between py-2 text-lg">
        <span>Auto RP</span>
        <Switch checked={auto} onCheckedChange={onAutoChange} />
      </label>
      <label className="flex items-center justify-between py-2 text-lg">
        <span>Barge RP</span>
        <Switch checked={barge} onCheckedChange={onBargeChange} />
      </label>
    </div>
  );
}

