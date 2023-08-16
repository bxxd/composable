export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200  shadow-md">
      <div className="container mx-auto px-6 py-3 md:flex md:items-center md:justify-between">
        <div className="flex w-full items-center justify-between">
          <div>
            <a href="#" className=" text-2xl font-bold">
              Composable
            </a>
          </div>
          <div className="flex md:flex">{/* <Menu /> */}</div>
        </div>
      </div>
    </header>
  );
}
