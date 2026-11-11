const Avatar = ({ src, name, size = 'w-8 h-8' }) => {
  const initials = (name || '?')[0].toUpperCase();
  return (
    <div className={`${size} rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden`}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};

export default Avatar;