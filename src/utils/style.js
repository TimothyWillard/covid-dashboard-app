const getClassForActiveState = (isActive) => {
    return isActive ? 'underline-active' : 'bold underline';
}

export default getClassForActiveState;
