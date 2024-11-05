import { Button } from "./Button";
import  Label  from "./Label";
import { Upload } from "lucide-react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function FileUpload({ id, label, file, onFileChange, accept = "image/*" }) {
  const handleChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileChange(selectedFile);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <input
            id={id}
            type="file"
            className="hidden"
            onChange={handleChange}
            accept={accept}
          />
          <Button
            type="button"
            onClick={() => document.getElementById(id).click()}
            className="w-full bg-white border-2 border-dashed border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400 flex items-center justify-center py-4"
          >
            <Upload className="mr-2 h-4 w-4" />
            <span>Choose {label}</span>
          </Button>
        </div>
        {file && (
          <div
            className={cn(
              "bg-gray-200 flex items-center justify-center overflow-hidden",
              id === "profileIcon"
                ? "w-12 h-12 rounded-full"
                : "w-24 h-12 rounded",
            )}
          >
            <img
              src={URL.createObjectURL(file)}
              alt={label}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
      {file && <p className="text-sm text-gray-500 truncate">{file.name}</p>}
    </div>
  );
}
