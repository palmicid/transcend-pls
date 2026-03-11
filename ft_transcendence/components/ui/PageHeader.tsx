import { typography } from "@/design-system/typography";

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className={typography.h1}>{title}</h1>

      {description && (
        <p className={`${typography.caption} mt-2`}>
          {description}
        </p>
      )}
    </div>
  );
}
