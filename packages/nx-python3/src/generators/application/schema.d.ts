export interface ApplicationGeneratorSchema {
  name: string;
  tags?: string;
  directory?: string;
  allowPre?: boolean;
  formatter: 'none' | 'autopep8' | 'black';
  testRunner: 'none' | 'pytest' | 'robot';
  typeChecker: 'none' | 'mypy' | 'pyright' | 'pytype' | 'pyre';
}
