import { slugify } from "@/lib/slug";

export type NavItem = {
  id: string;
  title: string;
};

type BlockLike = {
  block_type?: string;
  content?: Record<string, unknown>;
};

type NavOptions = {
  includeContact?: boolean;
  maxItems?: number;
};

/**
 * Build navigation items from builder blocks.
 */
export function buildNavItemsFromBlocks(
  blocks: BlockLike[],
  options: NavOptions = {}
): NavItem[] {
  const includeContact = options.includeContact ?? false;
  const maxItems = options.maxItems ?? 6;
  const items = blocks
    .filter((block) => block.block_type !== "hero")
    .filter((block) => includeContact || block.block_type !== "contact")
    .map((block) => {
      const title =
        (block.content?.short_title as string | undefined) ||
        (block.content?.title as string | undefined) ||
        "";
      const id = slugify((block.content?.title as string | undefined) ?? "");
      return { title, id };
    })
    .filter((item) => item.title && item.id)
    .slice(0, maxItems);

  return items;
}
