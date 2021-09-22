import { InputBoxOptions, window } from 'vscode';


const regex = /[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62}|(:[0-9]{1,4}))+\.?/;

function validVncHost(value: string) {
  return regex.test(value) ? null : 'Illgal VNC Sever Address!';
}


export async function inputVNCServer(): Promise<string | undefined> {
  const options: InputBoxOptions = {
    title: 'Add VNC Server',
    placeHolder: 'Please Input VNC Server Address!',
    validateInput: validVncHost
  };

  const res = await window.showInputBox(options);
  console.log('showAddVNCServerInput:', res);
  return res;
}


export async function editServerLabel(label: string): Promise<string | undefined> {
  const options: InputBoxOptions = {
    title: 'Set Vnc Host Short Name!',
    placeHolder: label,
    validateInput: value => { return value ? '' : 'Short Name Should Not Null!'; }
  };
  const res = await window.showInputBox(options);
  return res;
}

export async function showVncPassWdInput(title: string): Promise<string | undefined> {
  const options: InputBoxOptions = {
    title,
    password: true,
    validateInput: value => { return value ? '' : 'Password Should Not Null!'; }
  };
  const res = await window.showInputBox(options);
  return res;
}