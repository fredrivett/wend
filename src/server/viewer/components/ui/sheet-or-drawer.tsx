import type * as React from 'react';
import { useMediaQuery } from 'usehooks-ts';
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from './drawer';
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from './sheet';

interface SheetOrDrawerProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function SheetOrDrawer({ children, ...props }: SheetOrDrawerProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)', {
    defaultValue: true,
    initializeWithValue: false,
  });

  if (isDesktop) {
    return <Sheet {...props}>{children}</Sheet>;
  }

  return <Drawer {...props}>{children}</Drawer>;
}

function SheetOrDrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SheetContent>) {
  const isDesktop = useMediaQuery('(min-width: 768px)', {
    defaultValue: true,
    initializeWithValue: false,
  });

  if (isDesktop) {
    return (
      <SheetContent className={className} {...props}>
        {children}
      </SheetContent>
    );
  }

  return (
    <DrawerContent className={className} {...props}>
      {children}
    </DrawerContent>
  );
}

function SheetOrDrawerHeader({ className, ...props }: React.ComponentProps<'div'>) {
  const isDesktop = useMediaQuery('(min-width: 768px)', {
    defaultValue: true,
    initializeWithValue: false,
  });

  if (isDesktop) {
    return <SheetHeader className={className} {...props} />;
  }

  return <DrawerHeader className={className} {...props} />;
}

function SheetOrDrawerBody({ className, ...props }: React.ComponentProps<'div'>) {
  const isDesktop = useMediaQuery('(min-width: 768px)', {
    defaultValue: true,
    initializeWithValue: false,
  });

  if (isDesktop) {
    return <SheetBody className={className} {...props} />;
  }

  return <DrawerBody className={className} {...props} />;
}

function SheetOrDrawerFooter({ className, ...props }: React.ComponentProps<'div'>) {
  const isDesktop = useMediaQuery('(min-width: 768px)', {
    defaultValue: true,
    initializeWithValue: false,
  });

  if (isDesktop) {
    return <SheetFooter className={className} {...props} />;
  }

  return <DrawerFooter className={className} {...props} />;
}

function SheetOrDrawerTitle({ className, ...props }: React.ComponentProps<typeof SheetTitle>) {
  const isDesktop = useMediaQuery('(min-width: 768px)', {
    defaultValue: true,
    initializeWithValue: false,
  });

  if (isDesktop) {
    return <SheetTitle className={className} {...props} />;
  }

  return <DrawerTitle className={className} {...props} />;
}

function SheetOrDrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetDescription>) {
  const isDesktop = useMediaQuery('(min-width: 768px)', {
    defaultValue: true,
    initializeWithValue: false,
  });

  if (isDesktop) {
    return <SheetDescription className={className} {...props} />;
  }

  return <DrawerDescription className={className} {...props} />;
}

function SheetOrDrawerClose({ className, ...props }: React.ComponentProps<typeof SheetClose>) {
  const isDesktop = useMediaQuery('(min-width: 768px)', {
    defaultValue: true,
    initializeWithValue: false,
  });

  if (isDesktop) {
    return <SheetClose className={className} {...props} />;
  }

  return <DrawerClose className={className} {...props} />;
}

export {
  SheetOrDrawer,
  SheetOrDrawerBody,
  SheetOrDrawerClose,
  SheetOrDrawerContent,
  SheetOrDrawerDescription,
  SheetOrDrawerFooter,
  SheetOrDrawerHeader,
  SheetOrDrawerTitle,
};
