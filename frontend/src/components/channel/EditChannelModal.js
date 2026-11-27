import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Button from "../ui/Button";
import Label from "../ui/Label";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { Dialog, DialogContent, DialogTitle } from "../ui/Dialog";
import { forumService } from "../../services/forumService";
import { CHANNEL_CATEGORIES } from "./constants";
import {
  ChannelImagePicker,
  applyChannelImageChanges,
  emptyImageChange,
} from "./ChannelImagePicker";

/**
 * Owner-only dialog for editing a channel. The backend enforces the same rule
 * (PATCH /api/forums/:id returns 403 for anyone who isn't the channel admin).
 *
 * @param {object} channel - transformed channel data (name, description, category, rules[]).
 * @param {(updated: object) => void} onSaved - receives the server's updated forum.
 */
export function EditChannelModal({ channel, open, onOpenChange, onSaved }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [rules, setRules] = useState("");
  const [avatar, setAvatar] = useState(emptyImageChange);
  const [banner, setBanner] = useState(emptyImageChange);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Start from the current values each time the dialog opens.
  useEffect(() => {
    if (open && channel) {
      setName(channel.name || "");
      setDescription(channel.description || "");
      setCategory(channel.category || "");
      setRules((channel.rules || []).join("\n"));
      setAvatar(emptyImageChange());
      setBanner(emptyImageChange());
      setError("");
    }
  }, [open, channel]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Only send what changed (the API rejects a no-op update).
    const original = {
      name: channel.name || "",
      description: channel.description || "",
      category: channel.category || "",
      rules: (channel.rules || []).join("\n"),
    };
    const next = {
      name: name.trim(),
      description: description.trim(),
      category,
      rules: rules.trim(),
    };
    const updates = Object.fromEntries(
      Object.entries(next).filter(([k, v]) => v !== original[k]),
    );
    const imageChanged = Boolean(avatar.file || avatar.removed || banner.file || banner.removed);
    if (!Object.keys(updates).length && !imageChanged) {
      onOpenChange(false);
      return;
    }

    setIsSaving(true);
    let saved = {};
    if (Object.keys(updates).length) {
      const { data, error: saveError } = await forumService.updateForum(channel._id, updates);
      if (saveError || !data) {
        setIsSaving(false);
        setError(saveError || "Couldn't save your changes.");
        return;
      }
      saved = data;
    }
    const { urls, errors } = imageChanged
      ? await applyChannelImageChanges(channel._id, { avatar, banner })
      : { urls: {}, errors: [] };
    setIsSaving(false);

    onSaved({ ...saved, ...urls });
    if (errors.length) {
      // Text changes (if any) are saved; keep the dialog open for the images.
      setError(errors.join("\n"));
      return;
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isSaving && onOpenChange(o)}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[560px] max-h-[90vh] overflow-y-auto bg-white">
        <DialogTitle className="text-2xl font-bold text-green-600">Edit Channel</DialogTitle>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Channel Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={3}
              maxLength={50}
              pattern="[A-Za-z0-9 \-]+"
              title="Letters, numbers, spaces and hyphens only"
            />
            {name.trim() !== (channel?.name || "") && (
              <p className="text-xs text-amber-700">
                Renaming also changes the channel's link.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={10}
              maxLength={500}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="edit-category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CHANNEL_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-rules">Rules (one per line, optional)</Label>
            <Textarea
              id="edit-rules"
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder={"Be respectful\nNo sharing exam answers"}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <ChannelImagePicker
              kind="avatar"
              label="Channel icon"
              currentUrl={channel?.avatar_url}
              value={avatar}
              onChange={setAvatar}
              disabled={isSaving}
            />
            <ChannelImagePicker
              kind="banner"
              label="Banner"
              currentUrl={channel?.banner_url}
              value={banner}
              onChange={setBanner}
              disabled={isSaving}
            />
          </div>

          {error && (
            <p role="alert" className="whitespace-pre-line rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              disabled={isSaving}
              onClick={() => onOpenChange(false)}
              className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
