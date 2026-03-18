interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  image?: string;
  compact?: boolean;
}

const Card = ({
  title,
  children,
  className = '',
  actions,
  image,
  compact = false,
}: CardProps) => {
  return (
    <div
      className={`card bg-base-100 shadow-xl ${compact ? 'card-compact' : ''} ${className}`}
    >
      {image && (
        <figure>
          <img src={image} alt={title || 'Card image'} />
        </figure>
      )}
      <div className="card-body gap-0">
        {title && <h2 className="card-title">{title}</h2>}
        {children}
        {actions && <div className="card-actions justify-end">{actions}</div>}
      </div>
    </div>
  );
};

export default Card;
